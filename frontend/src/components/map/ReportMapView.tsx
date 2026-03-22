"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  ImageOverlay,
  useMap,
} from "react-leaflet";

function MapContent({ children }: { children: React.ReactNode }) {
  const map = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [map]);

  if (!ready) return null;
  return <>{children}</>;
}

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ReportMapViewProps {
  geometry: any;
  analysisId: string;
  accessToken: string;
}

function MapBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

function OverlayLayer({
  analysisId,
  accessToken,
  bounds,
}: {
  analysisId: string;
  accessToken: string;
  bounds: L.LatLngBounds;
}) {
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverlay = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/analyses/${analysisId}/overlay`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setOverlayUrl(url);
        }
      } catch (error) {
        console.error("Error loading overlay:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOverlay();

    return () => {
      if (overlayUrl) {
        URL.revokeObjectURL(overlayUrl);
      }
    };
  }, [analysisId, accessToken]);

  if (loading || !overlayUrl) return null;

  return <ImageOverlay url={overlayUrl} bounds={bounds} opacity={0.7} />;
}

export default function ReportMapView({
  geometry,
  analysisId,
  accessToken,
}: ReportMapViewProps) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [positions, setPositions] = useState<L.LatLngExpression[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    console.log("Geometry received:", geometry);

    if (geometry?.type === "Polygon" && geometry.coordinates?.[0]) {
      console.log("Raw coordinates:", geometry.coordinates[0]);

      const rawCoords = geometry.coordinates[0];
      let coords: L.LatLngExpression[] = [];

      // Check if coordinates are objects with lat/lng or arrays
      if (rawCoords.length > 0 && typeof rawCoords[0] === "object") {
        if ("lat" in rawCoords[0] && "lng" in rawCoords[0]) {
          // Format: [{lat: X, lng: Y}, ...]
          coords = rawCoords.map(
            (coord: any) => [coord.lat, coord.lng] as L.LatLngExpression
          );
        } else if (Array.isArray(rawCoords[0]) && rawCoords[0].length === 2) {
          // Format: [[lng, lat], ...] (GeoJSON standard)
          coords = rawCoords.map(
            (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
          );
        }
      }

      console.log("Processed coords:", coords);

      if (coords.length === 0) {
        console.log("No valid coordinates found");
        return;
      }

      setPositions(coords);

      const latLngs = coords.map((c: L.LatLngExpression) => {
        const [lat, lng] = c as [number, number];
        return L.latLng(lat, lng);
      });
      const polygonBounds = L.latLngBounds(latLngs);
      console.log("Bounds:", polygonBounds);
      setBounds(polygonBounds);
    } else {
      console.log("Invalid geometry structure:", {
        type: geometry?.type,
        hasCoordinates: !!geometry?.coordinates,
        firstCoord: geometry?.coordinates?.[0],
      });
    }
  }, [geometry]);

  if (!isMounted || !bounds || positions.length === 0) {
    return (
      <div className="h-[400px] bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="h-[400px] rounded-lg overflow-hidden border border-slate-700">
      <MapContainer
        key={`report-map-${analysisId}`}
        center={bounds.getCenter()}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <MapContent>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={19}
          />

          <Polygon
            positions={positions}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />

          <OverlayLayer
            analysisId={analysisId}
            accessToken={accessToken}
            bounds={bounds}
          />

          <MapBounds bounds={bounds} />
        </MapContent>
      </MapContainer>
    </div>
  );

}
