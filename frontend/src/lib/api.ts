import { ApiService } from '@/services/api.service';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const getProperties = ApiService.getProperties.bind(ApiService);
export const getProperty = ApiService.getProperty.bind(ApiService);
export const createProperty = ApiService.createProperty.bind(ApiService);
export const updateProperty = ApiService.updateProperty.bind(ApiService);
export const deleteProperty = ApiService.deleteProperty.bind(ApiService);

export { ApiService };
