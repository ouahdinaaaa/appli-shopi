<<<<<<< HEAD
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

=======
import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
>>>>>>> 9e37be4 (push)
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
<<<<<<< HEAD
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
=======
    <AppProvider embedded apiKey={apiKey}>
      <ui-nav-menu>
>>>>>>> 9e37be4 (push)
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Additional page</Link>
<<<<<<< HEAD
      </NavMenu>
=======
      </ui-nav-menu>
>>>>>>> 9e37be4 (push)
      <Outlet />
    </AppProvider>
  );
}

<<<<<<< HEAD
// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
=======
// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
>>>>>>> 9e37be4 (push)
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
