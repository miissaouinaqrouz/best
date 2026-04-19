import { Router } from "express";
import { db, auctionsTable, bidsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, ilike, gte, lte, sql, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { emitBidUpdate, emitAuctionEnded } from "../lib/socket.js";
import { setCachedAuction, invalidateCache } from "../lib/cache.js";

const router = Router();

function auctionWithSeller(auction: any, seller: any) {
  return {
    id: auction.id,
    title: auction.title,
    description: auction.description,
    images: auction.images ?? [],
    category: auction.category,
    startingPrice: auction.startingPrice,
    currentPrice: auction.currentPrice,
    minimumIncrement: auction.minimumIncrement,
    status: auction.status,
    startTime: auction.startTime,
    endTime: auction.endTime,
    sellerId: auction.sellerId,
    sellerName: seller?.name ?? "Unknown",
    sellerAvatar: seller?.avatar ?? null,
    bidCount: auction.bidCount,
    winnerId: auction.winnerId ?? null,
    winnerName: null,
    createdAt: auction.createdAt,
  };
}

async function updateAuctionStatuses() {
  const now = new Date();
  await db.update(auctionsTable)
    .set({ status: "live" })
    .where(and(eq(auctionsTable.status, "scheduled"), sql`${auctionsTable.startTime} <= ${now}`));
  const ended = await db.update(auctionsTable)
    .set({ status: "ended" })
    .where(and(eq(auctionsTable.status, "live"), sql`${auctionsTable.endTime} <= ${now}`))
    .returning();
  for (const auction of ended) {
    if (auction.bidCount > 0) {
      const [topBid] = await db.select().from(bidsTable)
        .where(eq(bidsTable.auctionId, auction.id))
        .orderBy(desc(bidsTable.amount)).limit(1);
      if (topBid) {
        await db.update(auctionsTable).set({ winnerId: topBid.bidderId }).where(eq(auctionsTable.id, auction.id));
        await db.insert(notificationsTable).values([
          { userId: topBid.bidderId, type: "auction_won", title: "You won the auction!", message: `You won "${auction.title}" for $${topBid.amount.toFixed(2)}`, auctionId: auction.id },
          { userId: auction.sellerId, type: "new_bid", title: "Your auction ended", message: `"${auction.title}" sold for $${topBid.amount.toFixed(2)}`, auctionId: auction.id },
        ]);
        emitAuctionEnded(auction.id, topBid.bidderId, topBid.amount);
      }
    }
  }
}

router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    await updateAuctionStatuses();
    const { status, category, search, minPrice, maxPrice, page = "1", limit = "20" } = req.query as any;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (status) conditions.push(eq(auctionsTable.status, status));
    if (category) conditions.push(eq(auctionsTable.category, category));
    if (search) conditions.push(ilike(auctionsTable.title, `%${search}%`));
    if (minPrice) conditions.push(gte(auctionsTable.currentPrice, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(auctionsTable.currentPrice, parseFloat(maxPrice)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [auctions, [{ count }]] = await Promise.all([
      db.select().from(auctionsTable).where(whereClause).orderBy(desc(auctionsTable.createdAt)).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auctionsTable).where(whereClause),
    ]);

    const sellerIds = [...new Set(auctions.map(a => a.sellerId))];
    const sellers = sellerIds.length > 0
      ? await db.select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar }).from(usersTable).where(inArray(usersTable.id, sellerIds))
      : [];
    const sellerMap = Object.fromEntries(sellers.map(s => [s.id, s]));

    res.json({ auctions: auctions.map(a => auctionWithSeller(a, sellerMap[a.sellerId])), total: count, page: pageNum, totalPages: Math.ceil(count / limitNum) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, images, category, startingPrice, minimumIncrement, startTime, endTime } = req.body;
    if (!title || !description || !category || startingPrice == null || !endTime) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    const start = new Date(startTime || Date.now());
    const end = new Date(endTime);
    const now = new Date();
    const status = start <= now ? "live" : "scheduled";

    const [auction] = await db.insert(auctionsTable).values({
      title, description, images: images ?? [], category,
      startingPrice: parseFloat(startingPrice),
      currentPrice: parseFloat(startingPrice),
      minimumIncrement: parseFloat(minimumIncrement || 1),
      status, startTime: start, endTime: end,
      sellerId: req.userId!, bidCount: 0,
    }).returning();

    const [seller] = await db.select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar }).from(usersTable).where(eq(usersTable.id, req.userId!));
    res.status(201).json(auctionWithSeller(auction, seller));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  try {
    await updateAuctionStatuses();
    const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, req.params.id));
    if (!auction) { res.status(404).json({ error: "Auction not found" }); return; }

    const [seller] = await db.select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar }).from(usersTable).where(eq(usersTable.id, auction.sellerId));
    const recentBids = await db.select({
      id: bidsTable.id, auctionId: bidsTable.auctionId, bidderId: bidsTable.bidderId,
      amount: bidsTable.amount, createdAt: bidsTable.createdAt,
      bidderName: usersTable.name, bidderAvatar: usersTable.avatar,
    }).from(bidsTable).leftJoin(usersTable, eq(bidsTable.bidderId, usersTable.id))
      .where(eq(bidsTable.auctionId, req.params.id)).orderBy(desc(bidsTable.amount)).limit(10);

    setCachedAuction(auction.id, { currentPrice: auction.currentPrice, bidCount: auction.bidCount, endTime: auction.endTime });

    res.json({
      ...auctionWithSeller(auction, seller),
      recentBids: recentBids.map(b => ({
        id: b.id, auctionId: b.auctionId, bidderId: b.bidderId,
        bidderName: b.bidderName ?? "Unknown", bidderAvatar: b.bidderAvatar ?? null,
        amount: b.amount, createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [existing] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, req.params.id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.sellerId !== req.userId && !req.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
    const { title, description, images, status } = req.body;
    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (images) updates.images = images;
    if (status) updates.status = status;
    const [updated] = await db.update(auctionsTable).set(updates).where(eq(auctionsTable.id, req.params.id)).returning();
    invalidateCache(req.params.id);
    const [seller] = await db.select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar }).from(usersTable).where(eq(usersTable.id, updated.sellerId));
    res.json(auctionWithSeller(updated, seller));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [existing] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, req.params.id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.sellerId !== req.userId && !req.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
    await db.delete(bidsTable).where(eq(bidsTable.auctionId, req.params.id));
    await db.delete(auctionsTable).where(eq(auctionsTable.id, req.params.id));
    invalidateCache(req.params.id);
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/bids", async (req, res) => {
  try {
    const bids = await db.select({
      id: bidsTable.id, auctionId: bidsTable.auctionId, bidderId: bidsTable.bidderId,
      amount: bidsTable.amount, createdAt: bidsTable.createdAt,
      bidderName: usersTable.name, bidderAvatar: usersTable.avatar,
    }).from(bidsTable).leftJoin(usersTable, eq(bidsTable.bidderId, usersTable.id))
      .where(eq(bidsTable.auctionId, req.params.id)).orderBy(desc(bidsTable.createdAt));
    res.json({ bids: bids.map(b => ({ id: b.id, auctionId: b.auctionId, bidderId: b.bidderId, bidderName: b.bidderName ?? "Unknown", bidderAvatar: b.bidderAvatar ?? null, amount: b.amount, createdAt: b.createdAt })) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/bids", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, req.params.id));
    if (!auction) { res.status(404).json({ error: "Auction not found" }); return; }
    if (auction.status !== "live") { res.status(400).json({ error: "Auction is not live" }); return; }
    if (auction.sellerId === req.userId) { res.status(400).json({ error: "Cannot bid on your own auction" }); return; }
    const amount = parseFloat(req.body.amount);
    const minBid = auction.currentPrice + auction.minimumIncrement;
    if (amount < minBid) { res.status(400).json({ error: `Minimum bid is $${minBid.toFixed(2)}` }); return; }

    // Anti-sniping: extend 2 min if bid placed in last 2 min
    const now = new Date();
    const endTime = new Date(auction.endTime);
    const minsLeft = (endTime.getTime() - now.getTime()) / 60000;
    let newEndTime = endTime;
    if (minsLeft < 2) {
      newEndTime = new Date(now.getTime() + 2 * 60 * 1000);
      await db.update(auctionsTable).set({ endTime: newEndTime }).where(eq(auctionsTable.id, auction.id));
    }

    // Get previous top bidder for outbid notification
    const [prevTopBid] = await db.select().from(bidsTable).where(eq(bidsTable.auctionId, auction.id)).orderBy(desc(bidsTable.amount)).limit(1);

    const [bid] = await db.insert(bidsTable).values({ auctionId: auction.id, bidderId: req.userId!, amount }).returning();
    await db.update(auctionsTable).set({ currentPrice: amount, bidCount: sql`${auctionsTable.bidCount} + 1` }).where(eq(auctionsTable.id, auction.id));

    invalidateCache(auction.id);
    setCachedAuction(auction.id, { currentPrice: amount, bidCount: auction.bidCount + 1, endTime: newEndTime });

    const notifications = [];
    if (prevTopBid && prevTopBid.bidderId !== req.userId) {
      notifications.push({ userId: prevTopBid.bidderId, type: "outbid", title: "You've been outbid!", message: `Someone placed a higher bid of $${amount.toFixed(2)} on "${auction.title}"`, auctionId: auction.id });
    }
    notifications.push({ userId: auction.sellerId, type: "new_bid", title: "New bid on your auction", message: `New bid of $${amount.toFixed(2)} on "${auction.title}"`, auctionId: auction.id });
    if (notifications.length) await db.insert(notificationsTable).values(notifications);

    const [bidder] = await db.select({ name: usersTable.name, avatar: usersTable.avatar }).from(usersTable).where(eq(usersTable.id, req.userId!));

    const bidResponse = {
      id: bid.id, auctionId: bid.auctionId, bidderId: bid.bidderId,
      bidderName: bidder?.name ?? "Unknown", bidderAvatar: bidder?.avatar ?? null,
      amount: bid.amount, createdAt: bid.createdAt,
    };

    // Emit real-time socket event
    emitBidUpdate(auction.id, {
      bid: bidResponse,
      currentPrice: amount,
      bidCount: auction.bidCount + 1,
      endTime: newEndTime.toISOString(),
    });

    // Send push notifications
    try {
      const { sendPushNotifications } = await import("../lib/push.js");
      if (prevTopBid && prevTopBid.bidderId !== req.userId) {
        await sendPushNotifications([prevTopBid.bidderId], {
          title: "You've been outbid!",
          body: `Someone placed $${amount.toFixed(2)} on "${auction.title}"`,
          data: { auctionId: auction.id, type: "outbid" },
        });
      }
    } catch (_) {}

    res.status(201).json(bidResponse);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
