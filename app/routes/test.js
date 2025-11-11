// Utilisation de Response.json() natif

export const loader = async () => {
  return Response.json({ 
    success: true, 
    message: "Route simple fonctionne!",
    port: process.env.PORT || "unknown"
  });
};