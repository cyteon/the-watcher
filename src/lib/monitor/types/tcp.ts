import net from "net";
import db from "$lib/db";
import { heartbeats } from "$lib/db/schema";
import { saveStatusUpdate } from "../util";

export default async function checkTcpMonitor(monitor) {
    let startTime = Date.now();
    
    try {
        let socket = new net.Socket();
        socket.setTimeout(10000);

        socket.on("connect", async () => {
            let endTime = Date.now();
            let ms = endTime - startTime;

            console.log(`Monitor ${monitor.name} (${monitor.id}) TCP connection successful in ${ms}ms`);

            await saveStatusUpdate(monitor.id, "up", `TCP connection successful`);
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "up",
                response_time: ms,
            });

            socket.destroy();
        });

        socket.on("error", async (error) => {
            console.error(`Monitor ${monitor.name} (${monitor.id}) TCP connection failed with error:`, error);

            await saveStatusUpdate(monitor.id, "down", `TCP connection failed: ${error.message}`);
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "down",
                response_time: 0,
            });
        });

        socket.on("timeout", async () => {
            console.error(`Monitor ${monitor.name} (${monitor.id}) TCP connection timed out`);

            await saveStatusUpdate(monitor.id, "down", `TCP connection timed out`);
            await db.insert(heartbeats).values({
                monitor_id: monitor.id,
                timestamp: Math.floor(Date.now() / 1000),
                status: "down",
                response_time: 0,
            });

            socket.destroy();
        });

        const [host, port] = monitor.url.split(":");
        socket.connect(parseInt(port), host);
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