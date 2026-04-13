import { createMiddleware } from "@solidjs/start/middleware";
import { db } from "./lib/server/db";
import { users } from "./lib/server/db/schema";
import { redirect } from "@solidjs/router";

export default createMiddleware({
  onRequest: async (event) => {
    const url = new URL(event.request.url);
    const hasUser = db.select().from(users).get();

    if (hasUser) {
      if (url.pathname != "/setup") {
        return redirect("/setup");
      }
    }
  },
});
