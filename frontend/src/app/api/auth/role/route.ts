import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { sql } from "@/lib/db";

// Run this to ensure the DB schema is correctly mapped
async function ensureDbSchema() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS insured_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id VARCHAR(255) NOT NULL,
          stack_user_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          paid_price FLOAT DEFAULT 0,
          is_paid INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    try {
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS assigned_user_id VARCHAR(255);`;
    } catch (e: any) {}
  } catch (e) {
    console.error("Schema creation failed:", e);
  }
}

export async function POST(req: Request) {
  try {
    const { mode } = await req.json();

    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await user.update({ clientMetadata: { role: mode } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to apply role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to apply role" },
      { status: 500 }
    );
  }
}
