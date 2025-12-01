import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Planner AI - Plan Your Perfect Journey",
  description:
    "AI-powered trip planning assistant with real-time weather data and smart todo management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>
        <CopilotKit runtimeUrl="/api/copilotkit" agent="starterAgent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
