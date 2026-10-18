import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { disposableEmailProvidersService } from "../service";

class DisposableEmailProvidersController {
  public renderPage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const search = (req.query.search as string) || "";
      const domainPage = req.query.domainPage ? parseInt(req.query.domainPage as string, 10) : 1;
      const subdomainPage = req.query.subdomainPage ? parseInt(req.query.subdomainPage as string, 10) : 1;
      // Extract provider and domain from route params (e.g. /provider/:provider, /domain-inteligence/:domain)
      // or fallback to query params for backwards compatibility
      const provider = (req.params.provider as string) || (req.query.provider as string) || undefined;
      const domain = (req.params.domain as string) || (req.query.domain as string) || undefined;

      // Determine activeView:
      // - 'domain' (Tier 3 Domain Intelligence)
      // - 'domains' (Tier 2 Provider Domains)
      // - 'providers' (Tier 1 Provider Directory)
      let activeView: "providers" | "domains" | "domain" = "providers";
      if (domain || req.path.includes("/domain/")) {
        activeView = "domain";
      } else if (provider || req.path.includes("/provider/")) {
        activeView = "domains";
      }

      // Single aggregated API call to backend (queries DB & DNS in parallel on server)
      const pageData = await disposableEmailProvidersService.fetchDisposablePageData({
        page,
        limit,
        search,
        provider,
        domainPage,
        domain,
        subdomainPage,
      });

      if (pageData === "NOT_FOUND") {
        return next();
      }

      const selectedProvider = provider || null;
      const selectedDomain = domain || null;

      // Build canonical URL for pagination
      let canonicalUrl = 'https://stopreg.com/providers';
      if (selectedDomain) {
        canonicalUrl = `https://stopreg.com/domain/${selectedDomain}`;
        if (subdomainPage > 1) canonicalUrl += `?subdomainPage=${subdomainPage}`;
      } else if (selectedProvider) {
        canonicalUrl = `https://stopreg.com/provider/${selectedProvider}`;
        if (domainPage > 1) canonicalUrl += `?domainPage=${domainPage}`;
      } else {
        if (page > 1) canonicalUrl += `?page=${page}`;
      }

      const classification = pageData?.domainDetails?.classification || null;

      // Calculate domain age in days (server-side, matching domain-management.js approach)
      let domainAge = 'N/A';
      if (pageData?.domainDetails?.domain_age) {
        const ageDate = new Date(pageData.domainDetails.domain_age);
        if (!isNaN(ageDate.getTime())) {
          const now = new Date();
          const diffMs = now.getTime() - ageDate.getTime();
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const finalDays = days < 0 ? 0 : days;
          if (finalDays === 0) {
            domainAge = 'Today';
          } else {
            domainAge = `${finalDays} day${finalDays === 1 ? '' : 's'}`;
          }
        }
      }

      // Generate SEO meta tags based on active view and pagination
      let metaTitle = '';
      let metaDescription = '';

      if (selectedDomain) {
        // TIER 3: Domain Details Page
        if (subdomainPage === 1) {
          // metaTitle = `${selectedDomain} Disposable Email Domain | StopReg`;
          // metaDescription = `Learn about ${selectedDomain}, a disposable email domain associated with temporary email addresses. Check its classification and assess the risk of fake signups and trial abuse.`;
          metaTitle = pageData?.domainIntelligence?.metaTitle || "";
          metaDescription = pageData?.domainIntelligence?.metaDescription || "";
        } else {
          // metaTitle = `${selectedDomain} Disposable Email Subdomains Page ${subdomainPage} | StopReg`;
          metaTitle = `${pageData?.domainIntelligence?.metaTitle || ""} - Page ${subdomainPage}`;
          metaDescription = `Browsing page ${subdomainPage} of discovered subdomains for ${selectedDomain}. temporary email addresses and domains associated with this provider.`;
        }
      } else if (selectedProvider) {
        // TIER 2: Provider Domains Page
        if (domainPage === 1) {
          metaTitle = `${selectedProvider} Disposable & Temporary Email Domains | StopReg`;
          metaDescription = `Explore disposable and temporary email domains associated with ${selectedProvider}. Browse its linked domains and email infrastructure tracked by StopReg.`;
        } else {
          metaTitle = `${selectedProvider} Disposable Email Domains - Page ${domainPage} | StopReg`;
          metaDescription = `Browse page ${domainPage} of disposable and temporary email domains associated with ${selectedProvider}. Explore linked domains and email infrastructure tracked by StopReg.`;
        }
      } else {
        // TIER 1: Providers List Page
        if (page === 1) {
          metaTitle = 'Disposable & Temporary Email Providers | StopReg';
          metaDescription = 'Browse disposable and temporary email provider directory. Discover providers associated with throwaway and burner email domains.';
        } else {
          metaTitle = `Page ${page}- Disposable & Temporary Email Providers | StopReg`;
          metaDescription = `Browse page ${page} of the disposable and temporary email provider directory. Discover providers associated with throwaway and burner email domains.`;
        }
      }

      let viewPath = path.join(__dirname, "../views/disposable-email-providers.ejs");
      if (!fs.existsSync(viewPath)) {
        const fallbackPath = path.join(process.cwd(), "src/disposable-email-providers/views/disposable-email-providers.ejs");
        if (fs.existsSync(fallbackPath)) {
          viewPath = fallbackPath;
        }
      }

      return res.render(viewPath, {
        // SEO Meta Tags
        metaTitle,
        metaDescription,
        canonicalUrl,

        activeView,

        // Tier 1 Data
        providers: pageData?.providers || [],
        pagination: pageData?.pagination || { page, limit, total: 0, totalPages: 0 },
        searchQuery: search,

        // Tier 2 Data
        selectedProvider,
        providerDomains: pageData?.providerDomains || [],
        providerDomainsPagination: pageData?.providerDomainsPagination || {
          page: domainPage,
          limit: 15,
          total: 0,
          totalPages: 1,
        },

        // Tier 3 Data
        selectedDomain,
        domainDetails: pageData?.domainDetails || null,
        domainOverview: pageData?.domainIntelligence?.domainOverview || "",
        domainAge,
        classification,
        dnsData: pageData?.dnsData || null,
        subdomains: pageData?.subdomains || [],
        subdomainsPagination: pageData?.subdomainsPagination || {
          page: subdomainPage,
          limit: domain ? 50 : 15,
          total: 0,
          totalPages: 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const disposableEmailProvidersController = new DisposableEmailProvidersController();
