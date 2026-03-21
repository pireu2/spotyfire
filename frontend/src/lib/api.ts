import { ApiService } from "@/services/apiService";
import { PropertyService } from "@/services/propertyService";
import { AlertService } from "@/services/alertService";
import { ReportService } from "@/services/reportService";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export { ApiService, PropertyService, AlertService, ReportService };

export const getProperties = PropertyService.getAll.bind(PropertyService);
export const getProperty = PropertyService.getById.bind(PropertyService);
export const createProperty = PropertyService.create.bind(PropertyService);
export const updateProperty = PropertyService.update.bind(PropertyService);
export const deleteProperty = PropertyService.delete.bind(PropertyService);
