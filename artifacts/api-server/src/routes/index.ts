import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import notesRouter from "./notes";
import aiRouter from "./ai";
import savedRouter from "./saved";
import dashboardRouter from "./dashboard";
import pdfRouter from "./pdf";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(notesRouter);
router.use(aiRouter);
router.use(savedRouter);
router.use(dashboardRouter);
router.use(pdfRouter);

export default router;
