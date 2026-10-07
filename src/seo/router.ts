import { Router } from "express";
import { seoController } from "./controller";

export const SeoRouter = Router();

SeoRouter.get("/domain/:domain", seoController.renderDomainPage);
SeoRouter.get("/provider/:provider", seoController.renderProviderPage);
