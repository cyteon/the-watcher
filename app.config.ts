import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { initChecker } from "./src/lib/server/checker";

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),

      (() => {
        initChecker();

        return {
          name: "init-checker",
        };
      })(),
    ],
  },
  middleware: "src/middleware.ts",
});
