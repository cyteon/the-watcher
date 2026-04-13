import { createMiddleware } from "@solidjs/start/middleware";
import { db } from "./lib/server/db";
import { users } from "./lib/server/db/schema";
import { redirect } from "@solidjs/router";
import { getUser } from "./lib/server/auth";

export default createMiddleware({
  onRequest: async (event) => {
    const url = new URL(event.request.url);

    if (
      url.pathname.startsWith("/_server") ||
      url.pathname.startsWith("/assets")
    ) {
      return;
    }

    const hasUser = db.select().from(users).get();

    if (!hasUser) {
      if (url.pathname != "/setup") {
        return redirect("/setup", 302);
      }
    } else {
      if (url.pathname == "/setup") {
        return redirect("/dashboard", 302);
      }
    }

    if (url.pathname.startsWith("/dashboard")) {
      const user = await getUser();

      if (!user) {
        return redirect("/login", 302);
      }
    }
  },
});
