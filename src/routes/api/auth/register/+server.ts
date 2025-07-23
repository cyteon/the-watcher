import db from "$lib/db";
import { tokens, users } from "$lib/db/schema.js";
import { count } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function PUT({ request }) {
    const { username, password, confirmPassword } = await request.json();

    if (!username || !password || !confirmPassword) {
        return new Response("Please fill in all fields :p", { status: 400 });
    }

    if (password !== confirmPassword) {
        return new Response("Passwords do not match :p", { status: 400 });
    }

    const userCount = await db.select({
        count: count()
    }).from(users);

    if (userCount[0].count > 0) {
        return new Response("Nuh uh dont even try >:(", { status: 403 });
    }

    try {
        await db.insert(users).values({
            username,
            password: await bcrypt.hash(password, 12)
        });

        const bytes = new Uint8Array(48);
        crypto.getRandomValues(bytes);
        const token = btoa(String.fromCharCode(...bytes));

        await db.insert(tokens).values({
            token,
            username
        });

        return Response.json({ token, username }, { status: 201 });
    } catch (error) {
        console.error("Error registering user:", error);
        return new Response("Failed to register user :(", { status: 500 });
    }
}