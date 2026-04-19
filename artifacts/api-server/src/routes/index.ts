import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import auctionsRouter from "./auctions.js";
import usersRouter from "./users.js";
import notificationsRouter from "./notifications.js";
import adminRouter from "./admin.js";
import paymentsRouter from "./payments.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/auctions", auctionsRouter);
router.use("/users", usersRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;
