"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  useMapEvents,
  Tooltip,
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

interface PolygonDrawMapProps {
  onPolygonChange: (
    coordinates: { lat: number; lng: number }[],
    area: number,
    center: { lat: number; lng: number } | null
  ) => void;
  initialPolygon?: { lat: number; lng: number }[];
  existingPolygons?: { coordinates: any; name: string }[];
}

export type { PolygonDrawMapProps };

const markerIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="width: 12px; height: 12px; background-color: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function calculatePolygonArea(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;

  let area = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRadians(coords[i].lat);
    const lat2 = toRadians(coords[j].lat);
    const lng1 = toRadians(coords[i].lng);
    const lng2 = toRadians(coords[j].lng);

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2);

  return area / 10000;
}

function calculateCenter(
  coords: { lat: number; lng: number }[]
): { lat: number; lng: number } | null {
  if (coords.length === 0) return null;

  const sumLat = coords.reduce((acc, c) => acc + c.lat, 0);
  const sumLng = coords.reduce((acc, c) => acc + c.lng, 0);

  return {
    lat: sumLat / coords.length,
    lng: sumLng / coords.length,
  };
}

function MapClickHandler({
  coordinates,
  setCoordinates,
  onPolygonChange,
  setRedoStack,
}: {
  coordinates: { lat: number; lng: number }[];
  setCoordinates: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number }[]>
  >;
  onPolygonChange: PolygonDrawMapProps["onPolygonChange"];
  setRedoStack: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number }[]>
  >;
}) {
  useMapEvents({
    click: (e) => {
      const newCoord = { lat: e.latlng.lat, lng: e.latlng.lng };
      const newCoords = [...coordinates, newCoord];
      setCoordinates(newCoords);
      setRedoStack([]); // Clear redo stack on new input

      const area = calculatePolygonArea(newCoords);
      const center = calculateCenter(newCoords);
      onPolygonChange(newCoords, area, center);
    },
  });

  return null;
}

export default function PolygonDrawMap({
  onPolygonChange,
  initialPolygon,
  existingPolygons = [],
}: PolygonDrawMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setMapKey((prev) => prev + 1);
    return () => setIsMounted(false);
  }, []);

  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number }[]
  >(initialPolygon || []);

  const [redoStack, setRedoStack] = useState<{ lat: number; lng: number }[]>(
    []
  );

  useEffect(() => {
    if (initialPolygon && initialPolygon.length > 0) {
      setCoordinates(initialPolygon);
      setRedoStack([]);
      const area = calculatePolygonArea(initialPolygon);
      const center = calculateCenter(initialPolygon);
      onPolygonChange(initialPolygon, area, center);
    } else {
      setCoordinates([]);
      setRedoStack([]);
    }
  }, [initialPolygon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Command+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        if (coordinates.length > 0) {
          const lastPoint = coordinates[coordinates.length - 1];
          const newCoords = coordinates.slice(0, -1);
          setCoordinates(newCoords);
          setRedoStack((prev) => [...prev, lastPoint]); // Push to redo stack

          const area = calculatePolygonArea(newCoords);
          const center = calculateCenter(newCoords);
          onPolygonChange(newCoords, area, center);
        }
      }

      // Redo: Ctrl+Y or Command+Y (or Ctrl+Shift+Z)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        if (redoStack.length > 0) {
          const pointToRestore = redoStack[redoStack.length - 1];
          const newRedoStack = redoStack.slice(0, -1);
          setRedoStack(newRedoStack);

          const newCoords = [...coordinates, pointToRestore];
          setCoordinates(newCoords);

          const area = calculatePolygonArea(newCoords);
          const center = calculateCenter(newCoords);
          onPolygonChange(newCoords, area, center);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [coordinates, redoStack, onPolygonChange]);

  const handleMarkerClick = (index: number) => {
    const newCoords = coordinates.filter((_, i) => i !== index);
    setCoordinates(newCoords);
    setRedoStack([]);

    const area = calculatePolygonArea(newCoords);
    const center = calculateCenter(newCoords);
    onPolygonChange(newCoords, area, center);
  };

  const romaniaBounds: L.LatLngBoundsExpression = [
    [43.5, 20.2],
    [48.3, 30.0],
  ];

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400">Se încarcă harta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        key={isMounted ? `polygon-draw-map-${mapKey}` : "offline"}
        center={[45.9432, 24.9668]}
        zoom={7}
        minZoom={7}
        maxZoom={18}
        maxBounds={romaniaBounds}
        maxBoundsViscosity={1.0}
        className="h-full w-full"
        style={{ background: "#1e293b" }}
      >
        <MapContent>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            coordinates={coordinates}
            setCoordinates={setCoordinates}
            onPolygonChange={onPolygonChange}
            setRedoStack={setRedoStack}
          />

          {/* Existing Polygons Layer */}
          {existingPolygons.map((polygonData, index) => {
            // Flatten standard [lng, lat] arrays if needed, but assuming [lat, lng] for now
            // Strict validation to prevent crashing Leaflet
            const polygonCoords = polygonData.coordinates;
            const isValid =
              Array.isArray(polygonCoords) &&
              polygonCoords.length > 0 &&
              Array.isArray(polygonCoords[0]) &&
              polygonCoords[0].length >= 3 && // Require at least 3 points to be a valid polygon
              // Check deep validity of first point (Arrays or Objects)
              ((Array.isArray(polygonCoords[0][0]) &&
                (typeof polygonCoords[0][0][0] === "number" ||
                  ("lat" in (polygonCoords[0][0] as any) &&
                    "lng" in (polygonCoords[0][0] as any)))) ||
                typeof polygonCoords[0][0] === "number" ||
                ("lat" in (polygonCoords[0][0] as any) &&
                  "lng" in (polygonCoords[0][0] as any)));

            if (!isValid) return null;

            return (
              <Polygon
                key={`existing-polygon-${index}`}
                positions={polygonCoords as any}
                pathOptions={{
                  color: "#059669", // Green (matches "Sănătos" status)
                  fillColor: "#059669",
                  fillOpacity: 0.4,
                  weight: 3,
                  interactive: true, // Make sure it's interactive for tooltip
                }}
              >
                <Tooltip
                  sticky
                  direction="top"
                  offset={[0, -10]}
                  opacity={1}
                  className="custom-map-tooltip"
                >
                  {polygonData.name}
                </Tooltip>
              </Polygon>
            );
          })}

          {coordinates.length >= 3 && (
            <Polygon
              positions={coordinates.map(
                (c) => [c.lat, c.lng] as [number, number]
              )}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.3,
                weight: 2,
              }}
            />
          )}

          {coordinates.map((coord, index) => (
            <Marker
              key={`marker-${index}`}
              position={[coord.lat, coord.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => handleMarkerClick(index),
              }}
            />
          ))}
        </MapContent>
      </MapContainer>


      {coordinates.length > 0 && coordinates.length < 3 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-orange-500/20 backdrop-blur px-3 py-2 rounded-lg border border-orange-500/50 pointer-events-none">
          <p className="text-xs text-orange-400">
            Mai ai nevoie de {3 - coordinates.length} punct
            {coordinates.length === 2 ? "" : "e"}
          </p>
        </div>
      )}
    </div>
  );
}
