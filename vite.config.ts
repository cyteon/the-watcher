import { defineConfig, PluginOption } from "vite";
import { nitroV2Plugin as nitro } from "@solidjs/vite-plugin-nitro-2";

import { solidStart } from "@solidjs/start/config";
import { initChecker } from "./src/lib/server/checker";

export default defineConfig({
  plugins: [
    solidStart(),
    nitro(),
    (() => {
      initChecker();

      return {
        name: "init-server",
      };
    })(),
  ],
});
