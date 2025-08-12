import db from "$lib/db";
import { users } from "$lib/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
    const userCount = await db.select({
        count: count()
    }).from(users)

    if (userCount[0].count === 0) {
        return new Response(undefined, { status: 204 });
    }

    return new Response(undefined, { status: 200 });
}