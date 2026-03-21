import { db, usersTable, auctionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const JWT_SECRET = process.env["JWT_SECRET"] || "bidrush-secret-change-in-production";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", JWT_SECRET).update(password).digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  // Create demo user
  const existing = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, "demo@bidrush.com"))
    .limit(1);

  let demoUser;
  if (existing.length === 0) {
    const [u] = await db.insert(usersTable).values({
      name: "Demo User",
      email: "demo@bidrush.com",
      passwordHash: hashPassword("password123"),
      avatar: null,
      rating: 4.8,
      totalSales: 12,
      totalPurchases: 7,
      isAdmin: true,
    }).returning();
    demoUser = u;
    console.log("Created demo user:", demoUser.email);
  } else {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, existing[0].id));
    demoUser = u;
    console.log("Demo user already exists");
  }

  // Check if auctions exist
  const auctionCheck = await db.select().from(auctionsTable).limit(1);
  if (auctionCheck.length > 0) {
    console.log("Auctions already seeded");
    process.exit(0);
  }

  const now = new Date();
  const sampleAuctions = [
    {
      title: "Vintage Rolex Submariner 1968",
      description: "Exceptionally well-preserved vintage Rolex Submariner from 1968. Original dial, hands, and bezel. Full set with original box and papers. A true collector's piece.",
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
      category: "Collectibles",
      startingPrice: 15000,
      currentPrice: 15000,
      minimumIncrement: 500,
      status: "live" as const,
      startTime: new Date(now.getTime() - 3600000),
      endTime: new Date(now.getTime() + 2 * 3600000),
      sellerId: demoUser.id,
      bidCount: 0,
    },
    {
      title: "Apple MacBook Pro M4 Max",
      description: "Brand new sealed MacBook Pro 16\" with M4 Max chip, 64GB RAM, 2TB SSD. Space Black color. Warranty included. Never opened.",
      images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"],
      category: "Electronics",
      startingPrice: 2500,
      currentPrice: 2500,
      minimumIncrement: 50,
      status: "live" as const,
      startTime: new Date(now.getTime() - 7200000),
      endTime: new Date(now.getTime() + 6 * 3600000),
      sellerId: demoUser.id,
      bidCount: 0,
    },
    {
      title: "Original Banksy Print - Limited Edition",
      description: "Authenticated original Banksy screen print on archival paper. Certificate of authenticity included. Professionally framed. Limited edition of 150.",
      images: ["https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600"],
      category: "Art",
      startingPrice: 8000,
      currentPrice: 8000,
      minimumIncrement: 250,
      status: "live" as const,
      startTime: new Date(now.getTime() - 1800000),
      endTime: new Date(now.getTime() + 4 * 3600000),
      sellerId: demoUser.id,
      bidCount: 0,
    },
    {
      title: "Nike Air Jordan 1 Retro High OG 'Chicago' 1985",
      description: "Extremely rare original 1985 Air Jordan 1 'Chicago'. Size 10.5. 9/10 condition with original box. Authenticated by GOAT and PSA.",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
      category: "Fashion",
      startingPrice: 5000,
      currentPrice: 5000,
      minimumIncrement: 100,
      status: "live" as const,
      startTime: new Date(now.getTime() - 900000),
      endTime: new Date(now.getTime() + 30 * 60 * 1000),
      sellerId: demoUser.id,
      bidCount: 0,
    },
    {
      title: "2023 Porsche 911 GT3 RS Weissach Package",
      description: "Stunning GT3 RS in GT Silver Metallic. Full Weissach package, lifter, carbon bucket seats, PCCB. Only 3,200 miles. Clean title, never tracked.",
      images: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600"],
      category: "Vehicles",
      startingPrice: 250000,
      currentPrice: 250000,
      minimumIncrement: 5000,
      status: "scheduled" as const,
      startTime: new Date(now.getTime() + 86400000),
      endTime: new Date(now.getTime() + 5 * 86400000),
      sellerId: demoUser.id,
      bidCount: 0,
    },
    {
      title: "First Edition Signed Harry Potter Collection",
      description: "True first edition, first printing of Harry Potter and the Sorcerer's Stone. Signed by J.K. Rowling. Fine condition with original dust jacket.",
      images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"],
      category: "Collectibles",
      startingPrice: 25000,
      currentPrice: 27500,
      minimumIncrement: 1000,
      status: "ended" as const,
      startTime: new Date(now.getTime() - 7 * 86400000),
      endTime: new Date(now.getTime() - 86400000),
      sellerId: demoUser.id,
      bidCount: 3,
      winnerId: demoUser.id,
    },
  ];

  for (const a of sampleAuctions) {
    await db.insert(auctionsTable).values(a);
  }

  console.log(`Seeded ${sampleAuctions.length} auctions`);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
