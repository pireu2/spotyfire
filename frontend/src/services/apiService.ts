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

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.detail || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  static async get<T>(endpoint: string, accessToken?: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(
    endpoint: string,
    data: unknown,
    accessToken?: string,
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  static async patch<T>(
    endpoint: string,
    data: unknown,
    accessToken?: string,
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  static async put<T>(
    endpoint: string,
    data: unknown,
    accessToken?: string,
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  static async delete(endpoint: string, accessToken?: string): Promise<void> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      cache: "no-store",
      headers: this.getHeaders(accessToken),
    });
    await this.handleResponse<void>(response);
  }
}
