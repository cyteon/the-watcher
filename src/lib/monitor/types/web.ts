import db from "$lib/db";
import { heartbeats } from "$lib/db/schema";
import { saveStatusUpdate } from "../util";

export default async function checkWebMonitor(monitor) {
    let startTime = Date.now();

    try {
        const res = await fetch(monitor.url);

        if (!res.ok) {
            console.error(`Monitor ${monitor.name} (${monitor.id}) failed with status: ${res.status}`);

            await saveStatusUpdate(monitor.id, "down", `Request failed with status code ${res.status}`);
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "down",
                response_time: Date.now() - startTime,
            });
            
            return;
        }
        
        let endTime = Date.now();
        let ms = endTime - startTime;

        console.log(`Monitor ${monitor.name} (${monitor.id}) responded in ${ms}ms`);

        await saveStatusUpdate(monitor.id, "up", `${res.status} - ${res.statusText}`);
        await db.insert(heartbeats).values({
            monitor_id: monitor.id,
            timestamp: Math.floor(Date.now() / 1000),
            status: "up",
            response_time: ms,
        });
    } catch (error) {
        console.error(`Monitor ${monitor.name} (${monitor.id}) failed with error:`, error);

        await saveStatusUpdate(monitor.id, "down", error.message);
        await db.insert(heartbeats).values({
            monitor_id: monitor.id,
            timestamp: Math.floor(Date.now() / 1000),
            status: "down",
            response_time: Date.now() - startTime,
        });
    }
}