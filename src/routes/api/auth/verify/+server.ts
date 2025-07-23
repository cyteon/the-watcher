import { verifyRequest } from "$lib/api.server";

export async function POST({ request }) {
    const user = await verifyRequest(request);

    if (!user) {
        return new Response("Unauthorized :(", { status: 401 });
    }

    return Response.json({ username: user.username }, { status: 200 });
}