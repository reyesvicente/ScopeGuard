import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import { router } from "./app/router";
import { initAnalytics } from "./lib/analytics";
import "./styles/index.css";

initAnalytics(router);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
