"use server";

import { stackServerApp } from "@/stack/server";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Run this once or at startup to ensure the DB schema is correctly mapped
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
    // Attempt to add assigned_user_id to properties table if missing
    try {
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS assigned_user_id VARCHAR(255);`;
    } catch (e: any) {
      // Ignored if it already exists or not supported
    }
  } catch (e) {
    console.error("Schema creation failed:", e);
  }
}

export async function createIndividualUser(formData: FormData) {
  const company = await stackServerApp.getUser();
  if (!company) {
    throw new Error("Must be logged in to create a user");
  }

  const stackUserId = formData.get("stackUserId") as string;

  if (!stackUserId) {
    throw new Error("Missing required fields");
  }

  await ensureDbSchema();

  try {
    // 1. Fetch the exact selected user from Stack
    const response = await stackServerApp.listUsers();
    const users = Array.isArray(response) ? response : (response as any).items || (response as any).data || [];
    const userToAssign = users.find((u: any) => u.id === stackUserId);

    if (!userToAssign) {
      throw new Error("Selected user not found in the system");
    }

    const name = userToAssign.displayName || userToAssign.primaryEmail;
    const email = userToAssign.primaryEmail;

    // 2. Register user mapping in neon pg, avoiding duplicate email errors
    const existing = await sql`SELECT id FROM insured_users WHERE email = ${email} OR stack_user_id = ${stackUserId}`;
    if (existing.length > 0) {
      // If they somehow exist (e.g. email was added manually before), update them!
      await sql`
        UPDATE insured_users 
        SET company_id = ${company.id}, 
            stack_user_id = ${stackUserId}, 
            name = ${name}
        WHERE email = ${email} OR stack_user_id = ${stackUserId}
      `;
    } else {
      await sql`
        INSERT INTO insured_users (company_id, stack_user_id, name, email)
        VALUES (${company.id}, ${stackUserId}, ${name}, ${email})
      `;
    }
  } catch (error: any) {
    console.error("User assignment failed:", error);
    throw new Error(error.message || "Failed to assign user");
  }

  revalidatePath("/dashboard/asigurati");
}

export async function getIndividualUsers() {
  await ensureDbSchema();
  const company = await stackServerApp.getUser();
  if (!company) return [];

  const users = await sql`
    SELECT * FROM insured_users WHERE company_id = ${company.id}
  `;
  return users as any[];
}

export async function deleteIndividualUser(id: string) {
  const company = await stackServerApp.getUser();
  if (!company) return;

  // We only delete from the DB tracking. The Stack account is practically inaccessible or we just leave it for data integrity (or delete it if Stack allows API)
  await sql`
    DELETE FROM insured_users WHERE id = ${id} AND company_id = ${company.id}
  `;
  revalidatePath("/dashboard/asigurati");
}

export async function processPayment(id: string, price: number) {
  const company = await stackServerApp.getUser();
  if (!company) return;

  await sql`
    UPDATE insured_users
    SET is_paid = 1, paid_price = ${price}
    WHERE id = ${id} AND company_id = ${company.id}
  `;
  revalidatePath("/dashboard/asigurati");
}

export async function getUnassignedIndividuals() {
  await ensureDbSchema();
  const company = await stackServerApp.getUser();
  if (!company) return [];

  const response = await stackServerApp.listUsers();
  const users = Array.isArray(response) ? response : (response as any).items || (response as any).data || [];

  const assignedRecords = await sql`SELECT stack_user_id FROM insured_users`;
  const assignedIds = new Set(assignedRecords.map((r: any) => r.stack_user_id));

  // Show only users explicitly registered as 'individual' and not yet assigned
  const unassigned = users.filter((u: any) => 
    u.clientMetadata?.role === 'individual' && !assignedIds.has(u.id)
  );

  return unassigned.map((u: any) => ({
    id: u.id,
    name: u.displayName || u.primaryEmail,
    email: u.primaryEmail
  }));
}

export async function getCurrentUserRole() {
    await ensureDbSchema();
    const user = await stackServerApp.getUser();
    if (!user) return null;

    if (user.clientMetadata?.role) {
        return user.clientMetadata.role as string;
    }

    // Check if user is inside insured_users
    const records = await sql`
        SELECT id FROM insured_users WHERE stack_user_id = ${user.id} LIMIT 1
    `;

    return records.length > 0 ? "individual" : "company";
}
