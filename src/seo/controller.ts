import { Request, Response, NextFunction } from "express";
import path from "path";
import config from "../config";
import { seoService } from "./service";

class SeoController {
  public renderDomainPage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const domain = req.params.domain;
      if (!domain) {
        return res.status(404).sendFile(path.join(config.app.publicDir, "404.html"));
      }

      const { status, html } = await seoService.fetchDomainPage(domain);
      if (status === 200 && html) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(html);
      }

      return res.status(status === 404 ? 404 : 502).sendFile(path.join(config.app.publicDir, "404.html"));
    } catch (error) {
      next(error);
    }
  };

  public renderProviderPage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.params.provider;
      if (!provider) {
        return res.status(404).sendFile(path.join(config.app.publicDir, "404.html"));
      }

      const { status, html } = await seoService.fetchProviderPage(provider);
      if (status === 200 && html) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(html);
      }

      return res.status(status === 404 ? 404 : 502).sendFile(path.join(config.app.publicDir, "404.html"));
    } catch (error) {
      next(error);
    }
  };
}

export const seoController = new SeoController();
