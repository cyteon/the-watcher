import { verifyRequest } from "$lib/api.server";
import db from "$lib/db/index.js";
import { heartbeats, monitors, statusUpdates } from "$lib/db/schema.js";
import { monitorList } from "$lib/monitor";

export async function PUT({ request }) {
    const user = await verifyRequest(request);

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const {
        name,
        url,
        heartbeat_interval,
        retries
    } = await request.json();

    if (!name || !heartbeat_interval) {
        return new Response("Bad Request", { status: 400 });
    }

    try {
        let result = await db.insert(monitors).values({
            name,
            url,
            heartbeat_interval,
            retries: retries || 0
        }).returning();

        monitorList.push({
            id: result[0].id,
            name,
            url,
            heartbeat_interval,
            retries: retries || 0,
        });

        return new Response("Monitor created successfully", { status: 201 });
    } catch (error) {
        console.error("Error creating monitor:", error);
        return Response.json({ error: error }, { status: 500 });
    }
}

export async function GET({ request }) {
    const user = await verifyRequest(request);

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        let monitorList = await db.select().from(monitors);
        let heartbeatsData = await db.select().from(heartbeats);
        let statusUpdatesData = await db.select().from(statusUpdates);

        monitorList = monitorList.map(monitor => {
            const monitorHeartbeats = heartbeatsData.filter(hb => hb.monitor_id === monitor.id);
            const monitorStatusUpdates = statusUpdatesData.filter(su => su.monitor_id === monitor.id);

            return {
                ...monitor,
                heartbeats: monitorHeartbeats,
                statusUpdates: monitorStatusUpdates,
            };
        });

        return Response.json(monitorList, { status: 200 });
    } catch (error) {
        console.error("Error fetching monitors:", error);
        return Response.json({ error: error }, { status: 500 });
    }
}