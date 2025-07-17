/**
 * Google Authentication Service
 * Handles authentication configuration and client setup
 */

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private apiKey: string;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    this.validateConfig();
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private validateConfig() {
    if (!this.apiKey) {
      console.warn('Google API Key not found in environment variables');
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const authService = GoogleAuthService.getInstance();
