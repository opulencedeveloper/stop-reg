import config from "../../config";
import Logging from "../../utils/logging";

export interface IProviderItem {
  provider: string;
  type: string;
  domainsCount: number;
  sampleDomains?: string[];
  updatedAt?: string | Date;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IProvidersResult {
  providers: IProviderItem[];
  pagination: IPagination;
}

export interface IDomainItem {
  domain: string;
  grade?: string;
  subdomainsCount?: number;
  domain_age?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IMxRecord {
  priority: number;
  exchange: string;
  host?: string;
}

export interface IDnsData {
  mxRecords?: IMxRecord[];
  spfRecords?: string[];
  dmarcRecords?: string[];
  dkimRecords?: string[];
  ipv4?: string[];
  ipv6?: string[];
}

export interface IDisposablePageData {
  providers: IProviderItem[];
  pagination: IPagination;
  selectedProvider?: string;
  providerDomains: IDomainItem[];
  providerDomainsPagination: IPagination;
  selectedDomain?: string;
  domainDetails?: any;
  dnsData?: any;
  subdomains?: any[];
  subdomainsPagination?: IPagination;
}

class DisposableEmailProvidersService {
  public async fetchDisposablePageData(options: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    domainPage?: number;
    domain?: string;
    subdomainPage?: number;
  } = {}): Promise<IDisposablePageData | "NOT_FOUND" | null> {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.search) params.set("search", options.search);
    if (options.provider) params.set("provider", options.provider);
    if (options.domainPage) params.set("domainPage", String(options.domainPage));
    if (options.domain) params.set("domain", options.domain);
    if (options.subdomainPage) params.set("subdomainPage", String(options.subdomainPage));

    const url = `${config.api.baseUrl}/email-domains/disposable-page-data?${params.toString()}`;
    Logging.info(`[DISPOSABLE-PAGE] Single API called: ${url}`);
    console.log(`[DISPOSABLE-PAGE] Fetching page data with options:`, options);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 404) {
        return "NOT_FOUND";
      }

      if (!response.ok) {
        Logging.warn(`Backend returned status ${response.status} when fetching disposable page data from ${url}`);
        console.warn(`[DISPOSABLE-PAGE] API error status: ${response.status}`);
        return null;
      }

      const json: any = await response.json();
      const data = json?.data || null;

      console.log(`[DISPOSABLE-PAGE] API Response received:`, {
        hasData: !!data,
        selectedDomain: data?.selectedDomain,
        subdomainsCount: data?.subdomains ? data.subdomains.length : 0,
        subdomains: data?.subdomains,
        providerDomainsCount: data?.providerDomains ? data.providerDomains.length : 0,
      });

      return data;
    } catch (error: any) {
      Logging.error(`Failed to fetch disposable page data: ${error.message}`);
      console.error(`[DISPOSABLE-PAGE] Fetch error:`, error);
      return null;
    }
  }

  public async fetchProviders(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<IProvidersResult> {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const searchParam = options.search ? `&search=${encodeURIComponent(options.search)}` : "";
    const url = `${config.api.baseUrl}/email-domains/disposable-providers?page=${page}&limit=${limit}${searchParam}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        Logging.warn(`Backend returned status ${response.status} when fetching providers from ${url}`);
        return {
          providers: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }

      const json: any = await response.json();
      const data = json?.data;

      return {
        providers: data?.providers || [],
        pagination: data?.pagination || { page, limit, total: 0, totalPages: 0 },
      };
    } catch (error: any) {
      Logging.error(`Failed to fetch disposable email providers: ${error.message}`);
      return {
        providers: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  public async fetchProviderDomains(provider: string, options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const searchParam = options.search ? `&search=${encodeURIComponent(options.search)}` : "";
    const url = `${config.api.baseUrl}/email-domains/disposable-providers/${encodeURIComponent(provider)}/domains?page=${page}&limit=${limit}${searchParam}`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const json: any = await response.json();
      return json?.data || null;
    } catch (error: any) {
      Logging.error(`Failed to fetch domains for provider ${provider}: ${error.message}`);
      return null;
    }
  }

  public async fetchDomainDetails(domain: string) {
    const url = `${config.api.baseUrl}/email-domains/disposable-domain/${encodeURIComponent(domain)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const json: any = await response.json();
      return json?.data || null;
    } catch (error: any) {
      Logging.error(`Failed to fetch domain details for ${domain}: ${error.message}`);
      return null;
    }
  }

  // public async fetchDomainDns(domain: string): Promise<IDnsData | null> {
  //   const url = `${config.api.baseUrl}/seo/dns/domain/${encodeURIComponent(domain)}`;
  //   try {
  //     const response = await fetch(url);
  //     if (!response.ok) return null;
  //     const json: any = await response.json();
  //     return json?.data || null;
  //   } catch (error: any) {
  //     Logging.error(`Failed to fetch DNS for ${domain}: ${error.message}`);
  //     return null;
  //   }
  // }
}

export const disposableEmailProvidersService = new DisposableEmailProvidersService();
