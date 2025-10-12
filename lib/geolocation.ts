export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export class GeolocationService {
  private static readonly TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_AGE = 60000; // 1 minute

  /**
   * Get current position using browser's geolocation API
   */
  static async getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 0,
          message: "Geolocation is not supported by this browser",
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: this.TIMEOUT,
        maximumAge: this.MAX_AGE,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Unknown geolocation error";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }

          reject({
            code: error.code,
            message,
          });
        },
        options
      );
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if current location is within allowed radius of target location
   */
  static async isWithinRadius(
    targetCoords: Coordinates,
    radiusMeters: number = 150
  ): Promise<{
    isWithin: boolean;
    distance: number;
    currentCoords: Coordinates;
  }> {
    try {
      const currentCoords = await this.getCurrentPosition();
      const distance = this.calculateDistance(currentCoords, targetCoords);

      return {
        isWithin: distance <= radiusMeters,
        distance: Math.round(distance),
        currentCoords,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request location permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) {
        // Fallback: try to get position to trigger permission request
        await this.getCurrentPosition();
        return true;
      }

      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "granted") {
        return true;
      } else if (permission.state === "prompt") {
        // Try to get position to trigger permission request
        await this.getCurrentPosition();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
}
