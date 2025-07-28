import db from "$lib/db";
import { heartbeats, statusUpdates } from "$lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function saveStatusUpdate(monitorId: number, status: string, message: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    
    try {
        const lastHeartbeat = await db.select()
            .from(heartbeats)
            .where(eq(heartbeats.monitor_id, monitorId))
            .orderBy(desc(heartbeats.timestamp))
            .limit(1).execute();
        
        if (lastHeartbeat.length > 0) {
            const lastStatus = lastHeartbeat[0].status;

            if (lastStatus === status) {
                return;
            }
        }

        await db.insert(statusUpdates).values({
            monitor_id: monitorId,
            timestamp,
            status,
            message,
        });
    } catch (error) {
        console.error("Error saving status update:", error);
    }
}