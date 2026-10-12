import { Router } from "express";
import { disposableEmailProvidersController } from "./controller";

const router = Router();

router.get("/providers", disposableEmailProvidersController.renderPage);
router.get("/provider/:provider", disposableEmailProvidersController.renderPage);
router.get("/domain/:domain", disposableEmailProvidersController.renderPage);

export const DisposableEmailProvidersRouter = router;
