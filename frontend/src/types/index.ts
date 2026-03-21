export type HealthStatus = "healthy" | "fire" | "flood";
export type DisasterType = "fire" | "flood" | "warning" | "ndvi";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type ChatRole = "user" | "assistant";
export type ReportStatus = "pending" | "approved" | "rejected" | "generated";
export type PackageType = "Basic" | "Pro" | "Enterprise" | "Per Raport";

export type Coordinates = [number, number];
export type CoordinateArray = Coordinates[];

export interface Geometry {
  id: string;
  type: "Polygon" | "MultiPolygon";
  coordinates: CoordinateArray[];
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  geometry: Geometry;
  crop_type: string;
  area_ha: number;
  center_lat: number;
  center_lng: number;
  estimated_value: number;
  risk_score: number;
  last_analysed_at: string;
  created_at: string;
  updated_at: string;
  activePackage: PackageType;
  reportsLeft: number;
}

export interface CreatePropertyRequest {
  name: string;
  geometry: {
    type: "Polygon";
    coordinates: { lat: number; lng: number }[][];
  };
  crop_type: string;
  area_ha: number;
  center_lat: number;
  center_lng: number;
  estimated_value: number;
  activePackage: PackageType;
  reportsLeft: number;
}

export interface UpdatePropertyRequest {
  name?: string;
  crop_type?: string;
  area_ha?: number;
  estimated_value?: number;
}

export interface LandParcel {
  id: string;
  name: string;
  coordinates: CoordinateArray;
  ndviIndex: number;
  status: HealthStatus;
  area: number;
  damageEstimate?: number;
  activePackage: PackageType;
  reportsLeft: number;
}

export interface Alert {
  id: string;
  type: DisasterType;
  message: string;
  timestamp: Date;
  sector: string;
  severity: AlertSeverity;
  lat?: number;
  lng?: number;
  created_at?: string;
  propertyId?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  context?: Record<string, unknown>;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  suggested_actions?: string[];
  claim_summary?: Record<string, unknown>;
}

export interface NDVIDataPoint {
  date: string;
  value: number;
}

export interface Report {
  id: string;
  propertyId: string;
  propertyName: string;
  disasterType: DisasterType;
  damageEstimate: number;
  area: number;
  date: Date;
  status: ReportStatus;
  content?: string;
}

export interface Subscription {
  id: string;
  propertyId: string;
  package: PackageType;
  reportsIncluded: number;
  reportsUsed: number;
  reportsLeft: number;
  createdAt: Date;
  expiresAt?: Date;
  hectares: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
