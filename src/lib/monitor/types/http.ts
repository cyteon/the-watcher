import db from "$lib/db";
import { heartbeats } from "$lib/db/schema";
import { saveStatusUpdate } from "../util";

export default async function checkHTTPMonitor(monitor) {
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
                response_time: 0,
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
    } catch (error: unknown) {
        console.error(`Monitor ${monitor.name} (${monitor.id}) failed with error:`, error);

        let cause = "";

        if (error?.cause?.code) {
            cause = ` [${error?.cause.code}]`;
        }

        await saveStatusUpdate(monitor.id, "down", `${error?.name}: ${error?.message}${cause}`);
        await db.insert(heartbeats).values({
            monitor_id: monitor.id,
            timestamp: Math.floor(Date.now() / 1000),
            status: "down",
            response_time: 0,
        });
    }
}