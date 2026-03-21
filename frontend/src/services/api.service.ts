import {
  Property,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  Alert,
} from "@/types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export class ApiService {
  private static getHeaders(accessToken?: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };
  }

  static async getProperties(accessToken?: string): Promise<Property[]> {
    const response = await fetch(`${API_URL}/api/properties`, {
      cache: "no-store",
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch properties");
    }

    return response.json();
  }

  static async getProperty(
    propertyId: string,
    accessToken?: string,
  ): Promise<Property> {
    const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      cache: "no-store",
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch property");
    }

    return response.json();
  }

  static async createProperty(
    data: CreatePropertyRequest,
    accessToken?: string,
  ): Promise<Property> {
    const response = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create property");
    }

    return response.json();
  }

  static async updateProperty(
    propertyId: string,
    data: UpdatePropertyRequest,
    accessToken?: string,
  ): Promise<Property> {
    const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      method: "PATCH",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update property");
    }

    return response.json();
  }

  static async deleteProperty(
    propertyId: string,
    accessToken?: string,
  ): Promise<void> {
    const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      method: "DELETE",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error("Failed to delete property");
    }
  }

  static async getAlerts(): Promise<Alert[]> {
    const response = await fetch(`${API_URL}/api/alerts`);

    if (!response.ok) {
      throw new Error("Failed to fetch alerts");
    }

    const data = await response.json();
    return (data.alerts || []).map((alert: any) => ({
      id: alert.id,
      type: alert.type.toLowerCase(),
      message: alert.message,
      timestamp: new Date(alert.created_at || alert.timestamp),
      sector: alert.sector,
      severity: alert.severity.toLowerCase(),
      lat: alert.lat,
      lng: alert.lng,
      created_at: alert.created_at,
    }));
  }
}
