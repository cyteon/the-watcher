import db from "$lib/db";
import { monitors } from "$lib/db/schema";

import checkHttpMonitor from "./types/http";
import checkPingMonitor from "./types/ping";
import checkTcpMonitor from "./types/tcp";

let timers: Record<number, number> = {};
export let monitorList: any[] = [];

function shouldCheckMonitor(id: number): boolean  {
    if (timers[id] === undefined) {
        timers[id] = 0
        return true;
    }

    timers[id] -= 1;

    if (timers[id] <= 0) {
        timers[id] = monitorList.find(m => m.id === id).heartbeat_interval;
        return true;
    }

    return false;
}

export default async function startMonitor() {
    try {
        monitorList = await db.select().from(monitors);
    } catch (error) {
        console.error("Error fetching monitors:", error);
    }

    setInterval(() => {
        try {
            // we do this so it dosent block the interval
            Promise.all(monitorList.map(async (monitor) => {
                if (shouldCheckMonitor(monitor.id)) {
                    console.log(`Checking monitor: ${monitor.name} (${monitor.id})`);

                    if (monitor.paused) return;

                    if (monitor.type === "http(s)") {
                        await checkHttpMonitor(monitor);
                    } else if (monitor.type === "ping") {
                        await checkPingMonitor(monitor);
                    } else if (monitor.type === "tcp") {
                        await checkTcpMonitor(monitor);
                    }
                }
            })).catch(console.error);
        } catch (error) {
            console.error("Error processing monitors:", error);
        }
    }, 1000); // every second

    setInterval(async () => {
        try {
            monitorList = await db.select().from(monitors);
        } catch (error) {
            console.error("Error refreshing monitors:", error);
        }
    }, 60000); // every minute
}