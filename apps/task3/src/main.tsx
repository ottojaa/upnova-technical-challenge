import { CopilotKit } from "@copilotkit/react-core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const COPILOT_CLOUD_API_KEY = "ck_pub_ed6a150411a66c8cac37234927deea8b";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <CopilotKit publicApiKey={COPILOT_CLOUD_API_KEY}>
      <App />
    </CopilotKit>
  </StrictMode>
);
