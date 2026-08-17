// API and Backend Services
export class ApiService {
  static async ping(): Promise<{ status: string }> {
    return { status: 'ok' };
  }
}
