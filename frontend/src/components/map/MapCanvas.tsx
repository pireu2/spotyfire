"use client";

import { memo } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LandParcel, Alert } from "@/types";

interface MapCanvasProps {
  parcels: LandParcel[];
  alerts?: Alert[];
  activeLayer?: string;
  onParcelSelect?: (parcel: LandParcel) => void;
}

const getParcelColor = (status: LandParcel["status"]) => {
  switch (status) {
    case "fire":
      return { color: "#ea580c", fillColor: "#ea580c" };
    case "flood":
      return { color: "#2563eb", fillColor: "#2563eb" };
    default:
      return { color: "#059669", fillColor: "#059669" };
  }
};

const getStatusText = (status: LandParcel["status"]) => {
  switch (status) {
    case "fire":
      return "Incendiu Detectat";
    case "flood":
      return "Inundație Detectată";
    default:
      return "Sănătos";
  }
};

const getNDVILabel = (value: number) => {
  if (value >= 0.7) return "Ridicat";
  if (value >= 0.4) return "Mediu";
  return "Scăzut";
};

function MapCanvas({
  parcels,
  alerts = [],
  activeLayer = "standard",
  onParcelSelect,
}: MapCanvasProps) {
  const romaniaBounds: [[number, number], [number, number]] = [
    [43.5, 20.2],
    [48.3, 30.0],
  ];

  const sectorCoordinates: Record<string, [number, number]> = {
    // Bucharest Sectors
    "Sector 1, București": [44.49, 26.05],
    "Sector 2, București": [44.46, 26.15],
    "Sector 3, București": [44.42, 26.18],
    "Sector 4, București": [44.37, 26.12],
    "Sector 5, București": [44.39, 26.04],
    "Sector 6, București": [44.43, 26.01],
    // Major Regions/Cities
    "Câmpia Dunării": [44.56, 27.36],
    Cluj: [46.7712, 23.6236],
    Timișoara: [45.7489, 21.2087],
    Iași: [47.1585, 27.6014],
    Craiova: [44.3302, 23.7949],
    Brașov: [45.6579, 25.6012],
    Constanța: [44.1792, 28.6387],
    Galați: [45.4353, 28.008],
    Oradea: [47.0465, 21.9189],
    Sibiu: [45.7983, 24.1256],
    Arad: [46.1866, 21.3123],
    Pitești: [44.8565, 24.8692],
    Bacău: [46.567, 26.9146],
    "Târgu Mureș": [46.5456, 24.5625],
    "Baia Mare": [47.6533, 23.5795],
    Buzău: [45.1502, 26.8167],
    "Satu Mare": [47.79, 22.8857],
    Botoșani: [47.741, 26.6669],
    "Râmnicu Vâlcea": [45.0997, 24.3693],
    Suceava: [47.6426, 26.2547],
    "Piatra Neamț": [46.9283, 26.3705],
    "Drobeta-Turnu Severin": [44.6369, 22.6597],
    Focșani: [45.696, 27.1842],
    Tulcea: [45.1768, 28.8073],
    Târgoviște: [44.9118, 25.4558],
    "Delta Dunării": [45.1667, 29.5],
    Zalău: [47.1797, 23.0553],
    Bistrița: [47.1358, 24.4988],
    Slatina: [44.4297, 24.3643],
    Călărași: [44.1956, 27.3323],
    Giurgiu: [43.9037, 25.9699],
    "Alba Iulia": [46.071, 23.571],
    "Sfântu Gheorghe": [45.8662, 25.7923],
    "Miercurea Ciuc": [46.3603, 25.8025],
    Alexandria: [43.9703, 25.3377],
    Reșița: [45.2997, 21.8906],
    Sinaia: [45.3524, 25.5492],
    Bran: [45.5193, 25.3719],
    Predeal: [45.5037, 25.5764],
    Mediaș: [46.1627, 24.3517],
    Turda: [46.5731, 23.7848],
    Sighișoara: [46.2197, 24.7964],
    Hunedoara: [45.7494, 22.8996],
    Deva: [45.8775, 22.9121],
    Petroșani: [45.4184, 23.3725],
    "Târgu Jiu": [45.0382, 23.2741],
    Rădăuți: [47.8427, 25.9181],
    Slobozia: [44.5638, 27.3619],
    Vaslui: [46.6407, 27.7276],
    Bârlad: [46.228, 27.6698],
    Roman: [46.9272, 26.9208],
    Onești: [46.2573, 26.7634],
    Făgăraș: [45.8456, 24.9738],
    Lugoj: [45.6886, 21.9032],
    Caransebeș: [45.419, 22.2223],
    "Curtea de Argeș": [45.1436, 24.6756],
    Câmpina: [45.1275, 25.7358],
    "Târgu Neamț": [47.2032, 26.3551],
    "Gura Humorului": [47.5539, 25.8887],
    "Vatra Dornei": [47.3453, 25.3533],
    Borșa: [47.6539, 24.6631],
    "Sighetu Marmației": [47.93, 23.8966],
    Carei: [47.683, 22.4674],
    Salonta: [46.8047, 21.6469],
    Beiuș: [46.6664, 22.3503],
    Marghita: [47.3486, 22.3435],
    Toplița: [46.9242, 25.3538],
    "Odorheiu Secuiesc": [46.3025, 25.3023],
    Gheorgheni: [46.7237, 25.6022],
    "Miercurea Nirajului": [46.5367, 24.7262],
    Reghin: [46.7842, 24.7001],
    Târnăveni: [46.3267, 24.2783],
    Aiud: [46.3083, 23.7125],
    Blaj: [46.1756, 23.9167],
    Sebeș: [45.9597, 23.5656],
    Orăștie: [45.8368, 23.2016],
    Vulcan: [45.3814, 23.2925],
    Lupeni: [45.3575, 23.2056],
    Hațeg: [45.6106, 22.9525],
    Brad: [46.1294, 22.7933],
    Ineu: [46.4278, 21.8417],
    Lipova: [46.0917, 21.6917],
    Nădlac: [46.1664, 20.7511],
    Jimbolia: [45.7925, 20.7203],
    Deta: [45.3917, 21.2222],
    Făget: [45.8528, 22.1794],
    "Sânnicolau Mare": [46.0717, 20.6278],
    Buziaș: [45.6486, 21.6033],
    Recaș: [45.8028, 21.5122],
    Ciacova: [45.5111, 21.1278],
    Gătaia: [45.4267, 21.4322],
    "Vârful Moldoveanu": [45.5995, 24.7363],
    "Vârful Omu": [45.4468, 25.4578],
    "Lacul Sfânta Ana": [46.1264, 25.8858],
    "Cheile Bicazului": [46.8117, 25.8061],
    "Transfăgărășan (Bâlea Lac)": [45.6041, 24.6148],
    "Delta Dunării (Sulina)": [45.1561, 29.6592],
    "Marea Neagră (Offshore)": [44.15, 29.1],
    Sarmizegetusa: [45.6231, 23.3113],
    Glina: [44.3833, 26.25],
    Fetești: [44.3853, 27.8242],
  };

  const getAlertColor = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case "fire":
        return "#ea580c"; // orange-600
      case "flood":
        return "#2563eb"; // blue-600
      case "warning":
        return "#eab308"; // yellow-500
      case "ndvi":
        return "#16a34a"; // green-600
      default:
        return "#64748b";
    }
  };

  const getTileLayer = () => {
    switch (activeLayer) {
      case "satellite":
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        };
      case "terrain":
        return {
          url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", // Using HOT for relief/humanitarian as OpenTopoMap can be slow/unreliable without API key sometimes
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France',
        };
      case "standard":
      default:
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        };
    }
  };

  const tileConfig = getTileLayer();

  return (
    <MapContainer
      center={[45.9432, 24.9668]}
      zoom={7}
      minZoom={7}
      maxZoom={18}
      maxBounds={romaniaBounds}
      maxBoundsViscosity={1.0}
      className="h-full w-full rounded-lg"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        key={activeLayer} // Force re-render on layer change
        attribution={tileConfig.attribution}
        url={tileConfig.url}
      />
      {parcels.map((parcel) => {
        const colors = getParcelColor(parcel.status);
        return (
          <Polygon
            key={parcel.id}
            positions={parcel.coordinates}
            pathOptions={{
              ...colors,
              fillOpacity: 0.4,
              weight: 3,
            }}
            eventHandlers={{
              click: () => {
                if (onParcelSelect) {
                  onParcelSelect(parcel);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-2">{parcel.name}</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Stare:</span>{" "}
                    <span
                      className={
                        parcel.status === "fire"
                          ? "text-orange-600"
                          : parcel.status === "flood"
                          ? "text-blue-600"
                          : "text-green-600"
                      }
                    >
                      {getStatusText(parcel.status)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Index Vegetație (NDVI):</span>{" "}
                    {parcel.ndviIndex.toFixed(2)} (
                    {getNDVILabel(parcel.ndviIndex)})
                  </p>
                  <p>
                    <span className="font-medium">Suprafață:</span>{" "}
                    {parcel.area} ha
                  </p>
                  {parcel.damageEstimate && (
                    <p className="text-red-600 font-medium">
                      Estimare Daune:{" "}
                      {parcel.damageEstimate.toLocaleString("ro-RO")} RON
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {alerts.map((alert) => {
        const coords =
          alert.lat && alert.lng
            ? [alert.lat, alert.lng]
            : sectorCoordinates[alert.sector];
        if (!coords) return null;

        return (
          <CircleMarker
            key={alert.id}
            center={coords as [number, number]}
            pathOptions={{
              color: getAlertColor(alert.type),
              fillColor: getAlertColor(alert.type),
              fillOpacity: 0.7,
              weight: 2,
            }}
            radius={8}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full`}
                    style={{ backgroundColor: getAlertColor(alert.type) }}
                  ></span>
                  <span className="font-bold capitalize">
                    {alert.type.toLowerCase() === "ndvi"
                      ? "Alertă NDVI"
                      : `Alertă ${alert.type.toLowerCase()}`}
                  </span>
                </div>
                <p className="text-sm font-medium">{alert.message}</p>
                <div className="text-xs text-slate-500 mt-2 flex justify-between">
                  <span>{alert.sector}</span>
                  <span>
                    {alert.created_at
                      ? new Date(alert.created_at).toLocaleDateString("ro-RO")
                      : new Date(alert.timestamp).toLocaleDateString("ro-RO")}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

export default memo(MapCanvas);
