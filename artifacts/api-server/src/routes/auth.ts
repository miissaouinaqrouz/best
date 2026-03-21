import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, createToken } from "../lib/auth.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password, avatar } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  try {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash: hashPassword(password),
      avatar: avatar || null,
      rating: 5.0,
      totalSales: 0,
      totalPurchases: 0,
      isAdmin: false,
    }).returning();
    const token = createToken(user.id);
    res.status(201).json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, avatar: user.avatar,
        rating: user.rating, totalSales: user.totalSales, totalPurchases: user.totalPurchases,
        isAdmin: user.isAdmin, createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = createToken(user.id);
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, avatar: user.avatar,
        rating: user.rating, totalSales: user.totalSales, totalPurchases: user.totalPurchases,
        isAdmin: user.isAdmin, createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    res.json({
      id: user.id, name: user.name, email: user.email, avatar: user.avatar,
      rating: user.rating, totalSales: user.totalSales, totalPurchases: user.totalPurchases,
      isAdmin: user.isAdmin, createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
