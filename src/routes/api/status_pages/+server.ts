import { verifyRequest } from "$lib/api.server";
import db from "$lib/db";
import { heartbeats, monitors, statusPages } from "$lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET() {
    let pages = await db.select().from(statusPages);

    let data = await db
        .select({
            id: monitors.id,
            name: monitors.name,
            heartbeat_interval: monitors.heartbeat_interval,
            heartbeat_id: heartbeats.id,
            heartbeat_status: heartbeats.status,
            heartbeat_timestamp: heartbeats.timestamp,
            heartbeat_response_time: heartbeats.response_time,
        })
        .from(monitors)
        .leftJoin(heartbeats, eq(monitors.id, heartbeats.monitor_id))
        .where(inArray(monitors.id, pages.flatMap(page => page.monitors || [])))
        .orderBy(desc(heartbeats.timestamp));

    let monitorsMap = new Map();
    data.forEach(item => {
        if (!monitorsMap.has(item.id)) {
            monitorsMap.set(item.id, {
                id: item.id,
                name: item.name,
                heartbeat_interval: item.heartbeat_interval,
                heartbeats: []
            });
        }
        if (item.heartbeat_id) {
            monitorsMap.get(item.id).heartbeats.push({
                id: item.heartbeat_id,
                status: item.heartbeat_status,
                timestamp: item.heartbeat_timestamp,
                response_time: item.heartbeat_response_time
            });
        }
    });

    return Response.json(
        pages.map(page => {
            const pageMonitors = page.monitors?.map(monitorId => 
                monitorsMap.get(parseInt(monitorId))
            ).filter(Boolean) || [];

            if (pageMonitors.length === 0) {
                return {
                    ...page,
                    monitor_count: 0,
                    monitors_up: 0,
                    status: "unknown"
                }
            }

            let heartbeatCount = 0;
            let totalOnline = 0;
            let totalPing = 0;
            let upMonitors = 0;

            pageMonitors.forEach(monitor => {
                heartbeatCount += monitor.heartbeats.length;
                monitor.heartbeats.forEach(hb => {
                    if (hb.status === "up") {
                        totalOnline++;
                        totalPing += hb.response_time;
                        upMonitors++;
                    }
                });
            });

            let avgUptime = (totalOnline / heartbeatCount) * 100;
            let avgPing = upMonitors > 0 ? (totalPing / upMonitors).toFixed(2) : null;

            let status;

            if (upMonitors === 0) {
                status = "down";
            } else if (upMonitors < pageMonitors.length) {
                status = "degraded";
            } else {
                status = "up";
            }

            return {
                ...page,
                avg_uptime: avgUptime.toFixed(2),
                avg_ping: avgPing,
                monitor_count: pageMonitors.length,
                monitors_up: upMonitors,
                status
            };
        })
    )
}

export async function PUT({ request }) {
    const user = await verifyRequest(request);

    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description } = await request.json();

    if (!name || !slug) {
        return Response.json({ error: "Name and slug are required" }, { status: 400 });
    }

    try {
        await db.insert(statusPages).values({
            name,
            slug,
            description: description || "No description",
        });

        return new Response(undefined, { status: 201 });
    } catch (error) {
        console.error("Error creating status page:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}