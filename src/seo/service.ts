import config from "../config";
import Logging from "../utils/logging";

class SeoService {
  public async fetchDomainPage(domain: string): Promise<{ status: number; html: string | null }> {
    const url = `${config.api.baseUrl}/seo/page/domain/${encodeURIComponent(domain)}`;
    Logging.info(`[SeoService] Fetching rendered domain page from backend: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        Logging.warn(`[SeoService] Backend returned status ${response.status} for domain ${domain}`);
        return { status: response.status, html: null };
      }

      const html = await response.text();
      return { status: 200, html };
    } catch (error: any) {
      Logging.error(`[SeoService] Failed to fetch domain page for ${domain}: ${error.message}`);
      return { status: 500, html: null };
    }
  }

  public async fetchProviderPage(provider: string): Promise<{ status: number; html: string | null }> {
    const url = `${config.api.baseUrl}/seo/page/provider/${encodeURIComponent(provider)}`;
    Logging.info(`[SeoService] Fetching rendered provider page from backend: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        Logging.warn(`[SeoService] Backend returned status ${response.status} for provider ${provider}`);
        return { status: response.status, html: null };
      }

      const html = await response.text();
      return { status: 200, html };
    } catch (error: any) {
      Logging.error(`[SeoService] Failed to fetch provider page for ${provider}: ${error.message}`);
      return { status: 500, html: null };
    }
  }
}

export const seoService = new SeoService();
