import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { db, auctionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

router.post("/create-intent", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId) { res.status(400).json({ error: "auctionId required" }); return; }

    const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId));
    if (!auction) { res.status(404).json({ error: "Auction not found" }); return; }
    if (auction.winnerId !== req.userId) { res.status(403).json({ error: "You are not the winner of this auction" }); return; }
    if (auction.status !== "ended") { res.status(400).json({ error: "Auction has not ended" }); return; }

    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Payment service not configured. Set STRIPE_SECRET_KEY." });
      return;
    }

    const amountCents = Math.round(auction.currentPrice * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: { auctionId: auction.id, buyerId: req.userId!, sellerId: auction.sellerId },
      description: `BidRush: ${auction.title}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: auction.currentPrice,
      auctionTitle: auction.title,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Payment error" });
  }
});

router.get("/status/:auctionId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, req.params.auctionId));
    if (!auction) { res.status(404).json({ error: "Auction not found" }); return; }

    res.json({
      auctionId: auction.id,
      title: auction.title,
      finalPrice: auction.currentPrice,
      winnerId: auction.winnerId,
      isWinner: auction.winnerId === req.userId,
      status: auction.status,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
