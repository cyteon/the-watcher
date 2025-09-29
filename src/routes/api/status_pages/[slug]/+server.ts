import { verifyRequest } from "$lib/api.server";
import db from "$lib/db";
import { heartbeats, monitors, statusPages, statusPageMonitors } from "$lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET({ params }) {
    let slug = params.slug;

    const [page] = await db.select().from(statusPages).where(eq(statusPages.slug, slug));

    if (!page) {
        return new Response("Not found", { status: 404 });
    }

    const pageMonitorRelations = await db
        .select({
            monitor_id: statusPageMonitors.monitor_id,
        })
        .from(statusPageMonitors)
        .where(eq(statusPageMonitors.status_page_id, page.id));

    const monitorIds = pageMonitorRelations.map(rel => rel.monitor_id);

    if (monitorIds.length === 0) {
        return Response.json({
            ...page,
            monitors: []
        });
    }

    const data = await db
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
        .where(inArray(monitors.id, monitorIds))

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

    return Response.json({
        ...page,
        monitors: Array.from(monitorsMap.values())
    });
}

export async function PATCH({ request, params }) {
    const user = await verifyRequest(request);

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    let slug = params.slug;

    const {
        name,
        slug: newSlug,
        description,
        monitors: monitorIds
    } = await request.json();

    try {
        const [page] = await db.select().from(statusPages).where(eq(statusPages.slug, slug));
        
        if (!page) {
            return new Response("Not found", { status: 404 });
        }

        let queryBody: any = {};
        if (name) queryBody.name = name;
        if (newSlug) queryBody.slug = newSlug;
        if (description !== undefined) queryBody.description = description;

        if (Object.keys(queryBody).length > 0) {
            await db.update(statusPages).set(queryBody).where(eq(statusPages.slug, slug));
        }

        if (monitorIds !== undefined) {
            await db.delete(statusPageMonitors).where(eq(statusPageMonitors.status_page_id, page.id));

            if (monitorIds.length > 0) {
                await db.insert(statusPageMonitors).values(
                    monitorIds.map(monitorId => ({
                        status_page_id: page.id,
                        monitor_id: parseInt(monitorId)
                    }))
                );
            }
        }

        return new Response("Status page updated successfully", { status: 200 });
    } catch (error) {
        console.error("Error updating status page:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}