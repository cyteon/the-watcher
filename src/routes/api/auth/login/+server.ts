import db from "$lib/db";
import { tokens, users } from "$lib/db/schema.js";
import { count, eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST({ request }) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return new Response("Please fill in all fields :p", { status: 400 });
    }

    try {
        const user = await db.select().from(users).where(eq(users.username, username));

        if (user.length === 0) {
            return new Response("User not found :(", { status: 404 });
        }

        const match = await bcrypt.compare(password, user[0].password);

        if (!match) {
            return new Response("Incorrect password >:(", { status: 401 });
        }

        const bytes = new Uint8Array(48);
        crypto.getRandomValues(bytes);
        const token = btoa(String.fromCharCode(...bytes));

        await db.insert(tokens).values({
            token,
            username
        });

        return Response.json({ token, username }, { status: 200 });
    } catch (error) {
        console.error("Error getting user:", error);
        return new Response("Failed to get user :(", { status: 500 });
    }
}