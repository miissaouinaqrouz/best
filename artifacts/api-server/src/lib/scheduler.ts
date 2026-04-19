import { db, auctionsTable, bidsTable, notificationsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { emitAuctionEnded, emitAuctionLive, getIO } from "./socket";
import { logger } from "./logger";

async function tick() {
  const now = new Date();
  try {
    const wentLive = await db.update(auctionsTable)
      .set({ status: "live" })
      .where(and(eq(auctionsTable.status, "scheduled"), sql`${auctionsTable.startTime} <= ${now}`))
      .returning({ id: auctionsTable.id });
    for (const a of wentLive) emitAuctionLive(a.id);

    const ended = await db.update(auctionsTable)
      .set({ status: "ended" })
      .where(and(eq(auctionsTable.status, "live"), sql`${auctionsTable.endTime} <= ${now}`))
      .returning();

    for (const auction of ended) {
      let winnerId: string | null = null;
      let finalPrice = auction.currentPrice;
      if (auction.bidCount > 0) {
        const [topBid] = await db.select().from(bidsTable)
          .where(eq(bidsTable.auctionId, auction.id))
          .orderBy(desc(bidsTable.amount))
          .limit(1);
        if (topBid) {
          winnerId = topBid.bidderId;
          finalPrice = topBid.amount;
          await db.update(auctionsTable).set({ winnerId }).where(eq(auctionsTable.id, auction.id));
          await db.insert(notificationsTable).values([
            {
              userId: topBid.bidderId, type: "auction_won",
              title: "You won the auction!",
              message: `You won "${auction.title}" for $${topBid.amount.toFixed(2)}`,
              auctionId: auction.id,
            },
            {
              userId: auction.sellerId, type: "new_bid",
              title: "Your auction ended",
              message: `"${auction.title}" sold for $${topBid.amount.toFixed(2)}`,
              auctionId: auction.id,
            },
          ]);
        }
      }
      emitAuctionEnded(auction.id, winnerId, finalPrice);
    }

    try {
      const io = getIO();
      const liveAuctions = await db.select({
        id: auctionsTable.id,
        endTime: auctionsTable.endTime,
        currentPrice: auctionsTable.currentPrice,
        bidCount: auctionsTable.bidCount,
      }).from(auctionsTable).where(eq(auctionsTable.status, "live"));
      for (const a of liveAuctions) {
        io.to(`auction:${a.id}`).emit("auction:timer", {
          auctionId: a.id,
          endTime: a.endTime,
          currentPrice: a.currentPrice,
          bidCount: a.bidCount,
          serverTime: now.toISOString(),
        });
      }
    } catch (_) {}
  } catch (err) {
    logger.error({ err }, "Scheduler tick error");
  }
}

export function startAuctionScheduler() {
  setInterval(tick, 10000);
  logger.info("Auction scheduler started (10s interval)");
}
