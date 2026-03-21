export class Validator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhoneRO(phone: string): boolean {
    phone = phone.replace(/\D/g, "");
    return phone.length === 10 && /^[237]\d{9}$/.test(phone);
  }

  static isValidLatLng(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  static isValidArea(area: number): boolean {
    return area > 0 && area <= 10000;
  }

  static isValidValue(value: number): boolean {
    return value > 0 && value <= 10000000;
  }

  static isValidPropertyName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 255;
  }

  static isValidCoordinates(coords: any[]): boolean {
    if (!Array.isArray(coords) || coords.length < 3) return false;

    return coords.every((coord: any) => {
      return (
        Array.isArray(coord) &&
        coord.length === 2 &&
        typeof coord[0] === "number" &&
        typeof coord[1] === "number" &&
        this.isValidLatLng(coord[0], coord[1])
      );
    });
  }

  static validatePolygonArea(
    coords: Array<{ lat: number; lng: number }>,
    minArea: number = 0.01,
  ): boolean {
    if (coords.length < 3) return false;

    const area = this.calculatePolygonArea(coords);
    return area >= minArea;
  }

  private static calculatePolygonArea(
    coords: Array<{ lat: number; lng: number }>,
  ): number {
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

  static validatePropertyFormData(data: {
    name?: string;
    cropType?: string;
    area?: number;
    value?: number;
    coordinates?: any[];
  }): string[] {
    const errors: string[] = [];

    if (!data.name || !this.isValidPropertyName(data.name)) {
      errors.push("Numele terenului trebuie să aibă între 2 și 255 caractere");
    }

    if (!data.cropType || !data.cropType.trim()) {
      errors.push("Selectează o cultură");
    }

    if (!data.area || !this.isValidArea(data.area)) {
      errors.push("Aria trebuie să fie între 0 și 10000 hectare");
    }

    if (!data.value || !this.isValidValue(data.value)) {
      errors.push("Valoarea estimată trebuie să fie între 0 și 10.000.000 RON");
    }

    if (!data.coordinates || !this.isValidCoordinates(data.coordinates)) {
      errors.push(
        "Coordonatele nu sunt valide. Asigură-te că ai trasat cel puțin 3 puncte.",
      );
    }

    return errors;
  }
}
