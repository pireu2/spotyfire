import { Report, ReportStatus } from "@/types";
import { ApiService } from "./apiService";

export interface GenerateReportRequest {
  propertyId: string;
  userDetails?: Record<string, unknown>;
}

export interface GenerateReportResponse {
  report_id: string;
  url: string;
  filename: string;
}

export class ReportService {
  private static readonly ENDPOINT = "/api/reports";
  private static readonly GENERATE_ENDPOINT = "/api/generate-report";

  static async getAll(accessToken?: string): Promise<Report[]> {
    return ApiService.get<Report[]>(this.ENDPOINT, accessToken);
  }

  static async getByProperty(
    propertyId: string,
    accessToken?: string,
  ): Promise<Report[]> {
    return ApiService.get<Report[]>(
      `${this.ENDPOINT}?property_id=${propertyId}`,
      accessToken,
    );
  }

  static async getById(
    reportId: string,
    accessToken?: string,
  ): Promise<Report> {
    return ApiService.get<Report>(`${this.ENDPOINT}/${reportId}`, accessToken);
  }

  static async generate(
    request: GenerateReportRequest,
    accessToken?: string,
  ): Promise<GenerateReportResponse> {
    return ApiService.post<GenerateReportResponse>(
      this.GENERATE_ENDPOINT,
      request,
      accessToken,
    );
  }

  static async delete(reportId: string, accessToken?: string): Promise<void> {
    await ApiService.delete(`${this.ENDPOINT}/${reportId}`, accessToken);
  }

  static getReportsByStatus(reports: Report[], status: ReportStatus): Report[] {
    return reports.filter((r) => r.status === status);
  }

  static sortByDate(reports: Report[], descending = true): Report[] {
    return [...reports].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return descending ? timeB - timeA : timeA - timeB;
    });
  }

  static calculateTotalDamage(reports: Report[]): number {
    return reports.reduce((sum, r) => sum + r.damageEstimate, 0);
  }

  static getStatistics(reports: Report[]) {
    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      approved: reports.filter((r) => r.status === "approved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      totalDamage: this.calculateTotalDamage(reports),
      averageDamage:
        reports.length > 0
          ? this.calculateTotalDamage(reports) / reports.length
          : 0,
    };
  }
}
