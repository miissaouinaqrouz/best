import { Router } from "express";
import { db, usersTable, auctionsTable, bidsTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/me/auctions", requireAuth, async (req: AuthRequest, res) => {
  try {
    const auctions = await db.select().from(auctionsTable)
      .where(eq(auctionsTable.sellerId, req.userId!))
      .orderBy(desc(auctionsTable.createdAt));

    const formatted = auctions.map(a => ({
      id: a.id, title: a.title, description: a.description, images: a.images ?? [],
      category: a.category, startingPrice: a.startingPrice, currentPrice: a.currentPrice,
      minimumIncrement: a.minimumIncrement, status: a.status, startTime: a.startTime,
      endTime: a.endTime, sellerId: a.sellerId, sellerName: "Me", sellerAvatar: null,
      bidCount: a.bidCount, winnerId: a.winnerId ?? null, winnerName: null, createdAt: a.createdAt,
    }));
    res.json({ auctions: formatted });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me/bids", requireAuth, async (req: AuthRequest, res) => {
  try {
    const bids = await db.select({
      id: bidsTable.id, auctionId: bidsTable.auctionId, bidderId: bidsTable.bidderId,
      amount: bidsTable.amount, createdAt: bidsTable.createdAt,
    }).from(bidsTable)
      .where(eq(bidsTable.bidderId, req.userId!))
      .orderBy(desc(bidsTable.createdAt));

    const auctionIds = [...new Set(bids.map(b => b.auctionId))];
    const auctions = auctionIds.length > 0
      ? await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionIds[0]))
      : [];
    const auctionMap: Record<string, any> = {};
    for (const id of auctionIds) {
      const [a] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, id));
      if (a) auctionMap[id] = {
        id: a.id, title: a.title, description: a.description, images: a.images ?? [],
        category: a.category, startingPrice: a.startingPrice, currentPrice: a.currentPrice,
        minimumIncrement: a.minimumIncrement, status: a.status, startTime: a.startTime,
        endTime: a.endTime, sellerId: a.sellerId, sellerName: "Seller", sellerAvatar: null,
        bidCount: a.bidCount, winnerId: a.winnerId ?? null, winnerName: null, createdAt: a.createdAt,
      };
    }

    const [user] = await db.select({ name: usersTable.name, avatar: usersTable.avatar })
      .from(usersTable).where(eq(usersTable.id, req.userId!));

    res.json({
      bids: bids.map(b => ({
        id: b.id, auctionId: b.auctionId, bidderId: b.bidderId,
        bidderName: user?.name ?? "Unknown", bidderAvatar: user?.avatar ?? null,
        amount: b.amount, createdAt: b.createdAt,
        auction: auctionMap[b.auctionId],
      })).filter(b => b.auction),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me/won", requireAuth, async (req: AuthRequest, res) => {
  try {
    const auctions = await db.select().from(auctionsTable)
      .where(eq(auctionsTable.winnerId, req.userId!))
      .orderBy(desc(auctionsTable.endTime));
    res.json({
      auctions: auctions.map(a => ({
        id: a.id, title: a.title, description: a.description, images: a.images ?? [],
        category: a.category, startingPrice: a.startingPrice, currentPrice: a.currentPrice,
        minimumIncrement: a.minimumIncrement, status: a.status, startTime: a.startTime,
        endTime: a.endTime, sellerId: a.sellerId, sellerName: "Seller", sellerAvatar: null,
        bidCount: a.bidCount, winnerId: a.winnerId ?? null, winnerName: "Me", createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user.id, name: user.name, avatar: user.avatar,
      rating: user.rating, totalSales: user.totalSales, totalPurchases: user.totalPurchases,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
