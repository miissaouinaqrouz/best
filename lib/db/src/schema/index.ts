import { pgTable, text, real, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"),
  rating: real("rating").notNull().default(5.0),
  totalSales: integer("total_sales").notNull().default(0),
  totalPurchases: integer("total_purchases").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const auctionsTable = pgTable("auctions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull().default([]),
  category: text("category").notNull(),
  startingPrice: real("starting_price").notNull(),
  currentPrice: real("current_price").notNull(),
  minimumIncrement: real("minimum_increment").notNull().default(1),
  status: text("status", { enum: ["live", "scheduled", "ended"] }).notNull().default("scheduled"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  sellerId: uuid("seller_id").notNull().references(() => usersTable.id),
  bidCount: integer("bid_count").notNull().default(0),
  winnerId: uuid("winner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuctionSchema = createInsertSchema(auctionsTable).omit({ id: true, createdAt: true, bidCount: true });
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctionsTable.$inferSelect;

export const bidsTable = pgTable("bids", {
  id: uuid("id").primaryKey().defaultRandom(),
  auctionId: uuid("auction_id").notNull().references(() => auctionsTable.id),
  bidderId: uuid("bidder_id").notNull().references(() => usersTable.id),
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBidSchema = createInsertSchema(bidsTable).omit({ id: true, createdAt: true });
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  type: text("type", { enum: ["outbid", "auction_ending", "auction_won", "auction_lost", "new_bid"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  auctionId: uuid("auction_id").references(() => auctionsTable.id),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type DbNotification = typeof notificationsTable.$inferSelect;
