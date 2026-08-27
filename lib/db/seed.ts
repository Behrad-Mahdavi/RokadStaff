import { getDb } from "./client";
import { adminUsers } from "./schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const db = getDb();
  console.log("🌱 Checking admin user on Neon Postgres...");

  try {
    // Create Default Admin User if not exists
    const existingAdmin = await db.select().from(adminUsers).limit(1);
    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash("admin123456", 10);
      await db.insert(adminUsers).values({
        email: "admin@rokad.ir",
        passwordHash,
        fullName: "مدیر ارشد رُکاد",
        role: "admin",
      });
      console.log("✅ Admin user created: admin@rokad.ir / admin123456");
    } else {
      console.log("ℹ️ Admin user already exists.");
    }
  } catch (error) {
    console.error("❌ Seed error:", error);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
