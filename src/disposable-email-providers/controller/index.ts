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
      // Extract provider and domain from route params (e.g. /provider/:provider, /domain-inteligence/:domain)
      // or fallback to query params for backwards compatibility
      const provider = (req.params.provider as string) || (req.query.provider as string) || undefined;
      const domain = (req.params.domain as string) || (req.query.domain as string) || undefined;

      // Determine activeView:
      // - 'domain' (Tier 3 Domain Intelligence)
      // - 'domains' (Tier 2 Provider Domains)
      // - 'providers' (Tier 1 Provider Directory)
      let activeView: "providers" | "domains" | "domain" = "providers";
      if (domain || req.path.includes("domain-inte")) {
        activeView = "domain";
      } else if (provider || req.path.includes("provider")) {
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
      });

      const selectedProvider = provider || pageData?.domainDetails?.provider || pageData?.selectedProvider || null;
      const selectedDomain = domain || pageData?.selectedDomain || null;

      const classification = pageData?.domainDetails?.classification || null;

      let viewPath = path.join(__dirname, "../views/disposable-email-providers.ejs");
      if (!fs.existsSync(viewPath)) {
        const fallbackPath = path.join(process.cwd(), "src/disposable-email-providers/views/disposable-email-providers.ejs");
        if (fs.existsSync(fallbackPath)) {
          viewPath = fallbackPath;
        }
      }

      return res.render(viewPath, {
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
        classification,
        dnsData: pageData?.dnsData || null,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const disposableEmailProvidersController = new DisposableEmailProvidersController();
