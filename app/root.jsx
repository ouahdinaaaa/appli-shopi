<<<<<<< HEAD
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html>
=======
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AppProvider, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export default function App() {
  return (
    <html lang="en">
>>>>>>> 9e37be4 (push)
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
<<<<<<< HEAD
        <Outlet />
=======
        <AppProvider>
          <Frame>
            <Outlet />
          </Frame>
        </AppProvider>
>>>>>>> 9e37be4 (push)
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 9e37be4 (push)
