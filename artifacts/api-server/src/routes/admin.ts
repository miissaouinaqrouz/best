import { Router } from "express";
import { db, usersTable, auctionsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/users", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json({
      users: users.map(u => ({
        id: u.id, name: u.name, email: u.email, avatar: u.avatar,
        rating: u.rating, totalSales: u.totalSales, totalPurchases: u.totalPurchases,
        isAdmin: u.isAdmin, createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auctions", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const auctions = await db.select().from(auctionsTable).orderBy(desc(auctionsTable.createdAt));
    const total = auctions.length;
    res.json({
      auctions: auctions.map(a => ({
        id: a.id, title: a.title, description: a.description, images: a.images ?? [],
        category: a.category, startingPrice: a.startingPrice, currentPrice: a.currentPrice,
        minimumIncrement: a.minimumIncrement, status: a.status, startTime: a.startTime,
        endTime: a.endTime, sellerId: a.sellerId, sellerName: "Admin View", sellerAvatar: null,
        bidCount: a.bidCount, winnerId: a.winnerId ?? null, winnerName: null, createdAt: a.createdAt,
      })),
      total,
      page: 1,
      totalPages: 1,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
