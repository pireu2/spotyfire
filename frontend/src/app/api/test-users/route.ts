import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

export async function GET() {
  try {
    const users = await stackServerApp.listUsers();
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
