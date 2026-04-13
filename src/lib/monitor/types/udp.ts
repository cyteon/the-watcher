import dgram from "dgram";
import db from "$lib/db";
import { heartbeats } from "$lib/db/schema";
import { saveStatusUpdate } from "../util";

export default async function checkUdpMonitor(monitor) {
    let startTime = Date.now();

    try {
        const [host, port] = monitor.url.split(":");
        const message = Buffer.from("ping");
        const client = dgram.createSocket("udp4");

        const timeout = setTimeout(async () => {
            client.close();
            
            await saveStatusUpdate(monitor.id, "down", "No response from server");
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "down",
                response_time: 0,
            });
        }, 10000);

        client.send(message, parseInt(port), host, (err) => {
            if (err) {
                clearTimeout(timeout);
                throw err;
            }
        });

        // this will only work if the server responds
        client.on("message", async (msg, rinfo) => {
            clearTimeout(timeout);
            let endTime = Date.now();
            let ms = endTime - startTime;

            console.log(`Monitor ${monitor.name} (${monitor.id}) UDP response received in ${ms}ms`);

            await saveStatusUpdate(monitor.id, "up", `UDP response received`);
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "up",
                response_time: ms,
            });

            client.close();
        });

        client.on("error", async (error) => {
            clearTimeout(timeout);
            console.error(`Monitor ${monitor.name} (${monitor.id}) UDP check failed with error:`, error);

            await saveStatusUpdate(monitor.id, "down", `UDP check failed: ${error.message}`);
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "down",
                response_time: 0,
            });

            client.close();
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