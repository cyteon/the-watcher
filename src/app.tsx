import { ColorModeProvider, ColorModeScript } from "@kobalte/core";
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "cal-sans";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense>
          <ColorModeScript />

          <ColorModeProvider>{props.children}</ColorModeProvider>
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
