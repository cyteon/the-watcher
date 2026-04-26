import { defineConfig, PluginOption } from "vite";
import { nitroV2Plugin as nitro } from "@solidjs/vite-plugin-nitro-2";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { initChecker } from "./src/lib/server/checker";

export default defineConfig({
  plugins: [
    solidStart({
      middleware: "./src/middleware.ts",
    }),

    nitro(),
    tailwindcss(),

    (() => {
      initChecker();

      return {
        name: "init-server",
      };
    })(),
  ],
  server: {
    allowedHosts: true,
  },
});
