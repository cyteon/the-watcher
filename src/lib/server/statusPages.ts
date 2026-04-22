"use server";

import { eq } from "drizzle-orm";
import { getUser } from "./auth";
import { db } from "./db";
import { statusPages } from "./db/schema";

export async function createStatusPage(data: { name: string; slug: string }) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  await db.insert(statusPages).values(data).execute();
}

export async function getStatusPages() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  return db.select().from(statusPages).all();
}

export async function getStatusPage(slug: string) {
  const page = db
    .select()
    .from(statusPages)
    .where(eq(statusPages.slug, slug))
    .get();

  if (!page) throw new Error("Status page not found");

  return page;
}
