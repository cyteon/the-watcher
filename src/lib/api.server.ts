import { eq } from "drizzle-orm";
import db from "./db";
import { tokens } from "./db/schema";

export async function verifyRequest(request: Request) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
        return null;
    }

    const data = await db.select().from(tokens).where(eq(tokens.token, token));

    if (data.length === 0) {
        return null;
    }

    return data[0];
}