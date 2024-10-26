import { ColorModeProvider, ColorModeScript } from "@kobalte/core";
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "cal-sans";
import "./app.css";
import { MetaProvider } from "@solidjs/meta";

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense>
          <MetaProvider>
            <ColorModeScript />
            <ColorModeProvider>{props.children}</ColorModeProvider>
          </MetaProvider>
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
