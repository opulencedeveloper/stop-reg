import { Router } from "express";
import { disposableEmailProvidersController } from "./controller";

const router = Router();

router.get("/", disposableEmailProvidersController.renderPage);
router.get("/provider/:provider", disposableEmailProvidersController.renderPage);
router.get("/domain-inteligence/:domain", disposableEmailProvidersController.renderPage);

export const DisposableEmailProvidersRouter = router;
