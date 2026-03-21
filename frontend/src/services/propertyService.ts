import {
  Property,
  CreatePropertyRequest,
  UpdatePropertyRequest,
} from "@/types";
import { ApiService } from "./apiService";

export class PropertyService {
  private static readonly ENDPOINT = "/api/properties";

  static async getAll(accessToken?: string): Promise<Property[]> {
    return ApiService.get<Property[]>(this.ENDPOINT, accessToken);
  }

  static async getById(
    propertyId: string,
    accessToken?: string,
  ): Promise<Property> {
    return ApiService.get<Property>(
      `${this.ENDPOINT}/${propertyId}`,
      accessToken,
    );
  }

  static async create(
    data: CreatePropertyRequest,
    accessToken?: string,
  ): Promise<Property> {
    return ApiService.post<Property>(this.ENDPOINT, data, accessToken);
  }

  static async update(
    propertyId: string,
    data: UpdatePropertyRequest,
    accessToken?: string,
  ): Promise<Property> {
    return ApiService.patch<Property>(
      `${this.ENDPOINT}/${propertyId}`,
      data,
      accessToken,
    );
  }

  static async delete(propertyId: string, accessToken?: string): Promise<void> {
    await ApiService.delete(`${this.ENDPOINT}/${propertyId}`, accessToken);
  }

  static validatePropertyData(data: Partial<CreatePropertyRequest>): string[] {
    const errors: string[] = [];

    if (!data.name?.trim()) errors.push("Property name is required");
    if (!data.crop_type?.trim()) errors.push("Crop type is required");
    if (!data.area_ha || data.area_ha <= 0)
      errors.push("Area must be greater than 0");
    if (!data.estimated_value || data.estimated_value <= 0)
      errors.push("Estimated value must be greater than 0");
    if (!data.geometry?.coordinates?.length)
      errors.push("Coordinates are required");

    return errors;
  }
}
