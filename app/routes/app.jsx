import { Link, Outlet, useLoaderData } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";

export const links = () => [
  { 
    rel: "stylesheet", 
    href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css" 
  }
];

export const loader = async ({ request }) => {
  // Import dynamique côté serveur uniquement
  const { authenticate } = await import("../shopify.server");
  // Exemple d'usage, ici désactivé temporairement
  // await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
  
}
