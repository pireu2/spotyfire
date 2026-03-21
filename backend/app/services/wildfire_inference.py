from __future__ import annotations

import os
from datetime import date, timedelta
from typing import Any, Dict, Tuple

import ee
import numpy as np
import requests
from rasterio.features import shapes
from rasterio.io import MemoryFile
from shapely.geometry import mapping, shape

from app.services.gee_service import init_gee

S2_BANDS = [
    "B1",
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "B8",
    "B8A",
    "B9",
    "B11",
    "B12",
]
S5_AEROSOL_BAND = "absorbing_aerosol_index"
PATCH_SIZE = 512

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "models",
    "sen2fire_unet.onnx",
)

_onnx_session = None
_onnx_input_name = ""
_onnx_output_name = ""


class FireAnalysisError(Exception):
    pass


def _parse_env_vector(name: str) -> np.ndarray | None:
    raw = os.getenv(name, "").strip()
    if not raw:
        return None

    values = [x.strip() for x in raw.split(",") if x.strip()]
    if len(values) != 13:
        raise FireAnalysisError(f"{name} must contain exactly 13 comma-separated values")

    try:
        return np.asarray([float(v) for v in values], dtype=np.float32)
    except ValueError as exc:
        raise FireAnalysisError(f"Invalid numeric value in {name}") from exc


def _load_onnx_model() -> Tuple[Any, str, str]:
    global _onnx_session, _onnx_input_name, _onnx_output_name

    if _onnx_session is not None:
        return _onnx_session, _onnx_input_name, _onnx_output_name

    model_path = os.getenv("WILDFIRE_ONNX_MODEL_PATH", DEFAULT_MODEL_PATH)
    if not os.path.exists(model_path):
        raise FireAnalysisError(
            f"Wildfire model file not found at {model_path}. "
            "Set WILDFIRE_ONNX_MODEL_PATH to a valid ONNX model path."
        )

    try:
        import onnxruntime as ort
    except ImportError as exc:
        raise FireAnalysisError(
            "onnxruntime is not installed. Add it to backend requirements."
        ) from exc

    session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    _onnx_session = session
    _onnx_input_name = input_name
    _onnx_output_name = output_name
    return session, input_name, output_name


def _extract_geometry(geojson: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(geojson, dict):
        raise FireAnalysisError("Invalid GeoJSON payload")

    geo_type = geojson.get("type")
    if geo_type == "Feature":
        geometry = geojson.get("geometry")
        if not geometry:
            raise FireAnalysisError("GeoJSON Feature must include geometry")
        return geometry

    if geo_type in {"Polygon", "MultiPolygon"}:
        return geojson

    raise FireAnalysisError("GeoJSON must be Polygon, MultiPolygon, or Feature")


def _build_composite_image(
    geom: ee.Geometry,
    incident_dt: date,
    days_window: int,
) -> ee.Image:
    start_date = (incident_dt - timedelta(days=days_window)).isoformat()
    end_date = (incident_dt + timedelta(days=days_window + 1)).isoformat()

    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(geom)
        .filterDate(start_date, end_date)
        .select(S2_BANDS)
        .median()
    )

    s5 = (
        ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_AER_AI")
        .filterBounds(geom)
        .filterDate(start_date, end_date)
        .select([S5_AEROSOL_BAND])
        .median()
        .rename(["B13"])
    )

    return s2.addBands(s5).reproject(crs="EPSG:3857", scale=10)


def _download_composite_geotiff(image: ee.Image, geom: ee.Geometry) -> bytes:
    bounded = geom.bounds(1)
    region = bounded.getInfo().get("coordinates")

    download_url = image.clip(bounded).getDownloadURL(
        {
            "format": "GEO_TIFF",
            "region": region,
            "crs": "EPSG:3857",
            "scale": 10,
            "filePerBand": False,
        }
    )

    response = requests.get(download_url, timeout=180)
    response.raise_for_status()
    return response.content


def _read_raster_bytes(raster_bytes: bytes) -> Tuple[np.ndarray, Any]:
    with MemoryFile(raster_bytes) as memfile:
        with memfile.open() as dataset:
            image = dataset.read(out_dtype=np.float32)
            transform = dataset.transform

    if image.shape[0] != 13:
        raise FireAnalysisError(f"Expected 13 bands but received {image.shape[0]}")

    return image, transform


def _pad_to_patch(image: np.ndarray) -> Tuple[np.ndarray, int, int]:
    channels, height, width = image.shape

    if height > PATCH_SIZE or width > PATCH_SIZE:
        raise FireAnalysisError(
            "Property bbox exceeds 512x512 at 10m resolution. "
            "Reduce area to approximately 5x5 km or less."
        )

    padded = np.zeros((channels, PATCH_SIZE, PATCH_SIZE), dtype=np.float32)
    padded[:, :height, :width] = image
    return padded, height, width


def _normalize_sen2fire(padded_image: np.ndarray) -> np.ndarray:
    normalized = np.zeros_like(padded_image, dtype=np.float32)

    # Sentinel-2 L2A surface reflectance is typically scaled by 10000.
    normalized[:12] = np.clip(padded_image[:12] / 10000.0, 0.0, 1.0)

    # Sentinel-5P aerosol index usually sits in a compact range around [-10, 10].
    normalized[12] = np.clip(padded_image[12], -10.0, 10.0) / 10.0

    mean_vec = _parse_env_vector("SEN2FIRE_NORM_MEAN")
    std_vec = _parse_env_vector("SEN2FIRE_NORM_STD")
    if mean_vec is not None and std_vec is not None:
        std_vec = np.where(std_vec == 0, 1.0, std_vec)
        normalized = (normalized - mean_vec[:, None, None]) / std_vec[:, None, None]

    return normalized


def _run_inference(normalized_image: np.ndarray) -> np.ndarray:
    session, input_name, output_name = _load_onnx_model()

    batch_input = normalized_image[np.newaxis, ...].astype(np.float32)
    output = session.run([output_name], {input_name: batch_input})[0]

    if output.ndim != 4:
        raise FireAnalysisError(f"Unexpected model output shape: {output.shape}")

    if output.shape[1] == 1:
        logits = output[0, 0, :, :]
    elif output.shape[-1] == 1:
        logits = output[0, :, :, 0]
    else:
        raise FireAnalysisError(f"Cannot infer binary logits from output shape: {output.shape}")

    probabilities = 1.0 / (1.0 + np.exp(-logits))
    return (probabilities > 0.5).astype(np.uint8)


def _vectorize_mask(mask: np.ndarray, transform: Any) -> Dict[str, Any]:
    features = []
    for geometry, value in shapes(mask.astype(np.uint8), mask=mask.astype(bool), transform=transform):
        if int(value) != 1:
            continue

        geometry_shape = shape(geometry)
        if geometry_shape.is_empty:
            continue

        if not geometry_shape.is_valid:
            geometry_shape = geometry_shape.buffer(0)
        if geometry_shape.is_empty:
            continue

        features.append(
            {
                "type": "Feature",
                "geometry": mapping(geometry_shape),
                "properties": {"class": "fire"},
            }
        )

    return {"type": "FeatureCollection", "features": features}


def run_fire_segmentation_analysis(
    geometry_geojson: Dict[str, Any],
    incident_date: str,
) -> Dict[str, Any]:
    if not init_gee():
        raise FireAnalysisError("Google Earth Engine initialization failed")

    try:
        incident_dt = date.fromisoformat(incident_date)
    except ValueError as exc:
        raise FireAnalysisError("incident_date must be in YYYY-MM-DD format") from exc

    geom_dict = _extract_geometry(geometry_geojson)
    ee_geom = ee.Geometry(geom_dict)

    days_window = int(os.getenv("SEN2FIRE_WINDOW_DAYS", "3"))
    composite = _build_composite_image(ee_geom, incident_dt, days_window)

    raster_bytes = _download_composite_geotiff(composite, ee_geom)
    image, transform = _read_raster_bytes(raster_bytes)

    padded_image, original_height, original_width = _pad_to_patch(image)
    normalized = _normalize_sen2fire(padded_image)

    predicted_mask = _run_inference(normalized)
    cropped_mask = predicted_mask[:original_height, :original_width]

    fire_pixel_count = int(cropped_mask.sum())
    total_pixel_count = int(original_height * original_width)

    damaged_area_ha = fire_pixel_count * 100.0 / 10000.0
    damage_percent = (fire_pixel_count / total_pixel_count * 100.0) if total_pixel_count else 0.0

    burn_scars = _vectorize_mask(cropped_mask, transform)

    return {
        "damaged_area_ha": round(float(damaged_area_ha), 4),
        "damage_percent": round(float(damage_percent), 4),
        "burn_scars_geojson": burn_scars,
    }
