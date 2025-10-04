import { verifyRequest } from "$lib/api.server";
import db from "$lib/db/index.js";
import { heartbeats, monitors, statusUpdates } from "$lib/db/schema.js";
import { monitorList } from "$lib/monitor";
import { eq } from "drizzle-orm";

export async function DELETE({ request, params }) {
    const user = await verifyRequest(request);

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;

    if (!id) {
        return new Response("Bad Request", { status: 400 });
    }

    try {
        await db.delete(monitors).where(eq(monitors.id, parseInt(id)));
        monitorList.splice(monitorList.findIndex(m => m.id === parseInt(id)), 1);

        return new Response("Monitor deleted successfully", { status: 200 });
    } catch (error) {
        console.error("Error deleting monitor:", error);
        return Response.json({ error: error }, { status: 500 });
    }
}