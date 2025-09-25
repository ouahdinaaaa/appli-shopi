import { json } from "@remix-run/node";

export const loader = async () => {
  return json({ 
    success: true, 
    message: "Route simple fonctionne!",
    port: process.env.PORT || "unknown"
  });
};