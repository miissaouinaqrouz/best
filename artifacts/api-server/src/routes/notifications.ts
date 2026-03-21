import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json({
      notifications: notifications.map(n => ({
        id: n.id, userId: n.userId, type: n.type, title: n.title,
        message: n.message, auctionId: n.auctionId ?? null, read: n.read, createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [notif] = await db.update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, req.params.id), eq(notificationsTable.userId, req.userId!)))
      .returning();
    if (!notif) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      id: notif.id, userId: notif.userId, type: notif.type, title: notif.title,
      message: notif.message, auctionId: notif.auctionId ?? null, read: notif.read, createdAt: notif.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
