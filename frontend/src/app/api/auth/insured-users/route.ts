import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await sql`
      SELECT stack_user_id, name, email FROM insured_users WHERE company_id = ${user.id}
    `;
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
