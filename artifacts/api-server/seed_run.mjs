import { createHmac } from "crypto";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JWT_SECRET = process.env.JWT_SECRET || "bidrush-secret-change-in-production";

function hashPassword(password) {
  return createHmac("sha256", JWT_SECRET).update(password).digest("hex");
}

const now = new Date();

async function seed() {
  console.log("Seeding database...");
  
  // Create demo user
  const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", ["demo@bidrush.com"]);
  
  let demoId;
  if (existing.rows.length === 0) {
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, rating, total_sales, total_purchases, is_admin) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      ["Demo User", "demo@bidrush.com", hashPassword("password123"), 4.8, 12, 7, true]
    );
    demoId = result.rows[0].id;
    console.log("Created demo user, id:", demoId);
  } else {
    demoId = existing.rows[0].id;
    console.log("Demo user exists, id:", demoId);
  }

  // Check for existing auctions
  const aCheck = await pool.query("SELECT COUNT(*) FROM auctions");
  if (parseInt(aCheck.rows[0].count) > 0) {
    console.log("Auctions already seeded");
    await pool.end();
    process.exit(0);
  }

  const auctions = [
    {
      title: "Vintage Rolex Submariner 1968",
      description: "Exceptionally well-preserved vintage Rolex Submariner from 1968. Original dial, hands, and bezel. Full set with original box and papers. A true collector's piece.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"]),
      category: "Collectibles", starting_price: 15000, current_price: 15000, minimum_increment: 500,
      status: "live",
      start_time: new Date(now.getTime() - 3600000).toISOString(),
      end_time: new Date(now.getTime() + 2 * 3600000).toISOString(),
      seller_id: demoId, bid_count: 0,
    },
    {
      title: "Apple MacBook Pro M4 Max",
      description: "Brand new sealed MacBook Pro 16\" with M4 Max chip, 64GB RAM, 2TB SSD. Space Black. Warranty included.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"]),
      category: "Electronics", starting_price: 2500, current_price: 2500, minimum_increment: 50,
      status: "live",
      start_time: new Date(now.getTime() - 7200000).toISOString(),
      end_time: new Date(now.getTime() + 6 * 3600000).toISOString(),
      seller_id: demoId, bid_count: 0,
    },
    {
      title: "Original Street Art Print - Limited Edition",
      description: "Authenticated original street art screen print on archival paper. Certificate of authenticity included. Professionally framed. Limited edition of 150.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600"]),
      category: "Art", starting_price: 8000, current_price: 8000, minimum_increment: 250,
      status: "live",
      start_time: new Date(now.getTime() - 1800000).toISOString(),
      end_time: new Date(now.getTime() + 4 * 3600000).toISOString(),
      seller_id: demoId, bid_count: 0,
    },
    {
      title: "Nike Air Jordan 1 Retro High OG 1985",
      description: "Extremely rare original 1985 Air Jordan 1 'Chicago'. Size 10.5. 9/10 condition with original box.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"]),
      category: "Fashion", starting_price: 5000, current_price: 5000, minimum_increment: 100,
      status: "live",
      start_time: new Date(now.getTime() - 900000).toISOString(),
      end_time: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      seller_id: demoId, bid_count: 0,
    },
    {
      title: "2023 Porsche 911 GT3 RS Weissach Package",
      description: "Stunning GT3 RS in GT Silver Metallic. Full Weissach package. Only 3,200 miles. Clean title.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600"]),
      category: "Vehicles", starting_price: 250000, current_price: 250000, minimum_increment: 5000,
      status: "scheduled",
      start_time: new Date(now.getTime() + 86400000).toISOString(),
      end_time: new Date(now.getTime() + 5 * 86400000).toISOString(),
      seller_id: demoId, bid_count: 0,
    },
    {
      title: "Signed First Edition Book Collection",
      description: "Rare first edition collection signed by the author. Fine condition with original dust jacket.",
      images: JSON.stringify(["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"]),
      category: "Collectibles", starting_price: 25000, current_price: 27500, minimum_increment: 1000,
      status: "ended",
      start_time: new Date(now.getTime() - 7 * 86400000).toISOString(),
      end_time: new Date(now.getTime() - 86400000).toISOString(),
      seller_id: demoId, bid_count: 3, winner_id: demoId,
    },
  ];

  for (const a of auctions) {
    await pool.query(
      `INSERT INTO auctions (title, description, images, category, starting_price, current_price, minimum_increment, status, start_time, end_time, seller_id, bid_count, winner_id)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [a.title, a.description, a.images, a.category, a.starting_price, a.current_price, a.minimum_increment, a.status, a.start_time, a.end_time, a.seller_id, a.bid_count || 0, a.winner_id || null]
    );
  }

  console.log(`Seeded ${auctions.length} auctions`);
  await pool.end();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
