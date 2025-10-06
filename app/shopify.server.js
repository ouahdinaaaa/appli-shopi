<<<<<<< HEAD
import "@shopify/shopify-app-remix/adapters/node";
=======
import "@shopify/shopify-app-react-router/adapters/node";
>>>>>>> 9e37be4 (push)
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
<<<<<<< HEAD
} from "@shopify/shopify-app-remix/server";
=======
} from "@shopify/shopify-app-react-router/server";
>>>>>>> 9e37be4 (push)
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
<<<<<<< HEAD
  apiVersion: ApiVersion.January25,
  scopes: process.env.SHOPIFY_SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders; // ⚠️ CETTE LIGNE DOIT ÊTRE PRÉSENTE
=======
  apiVersion: ApiVersion.July25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.SingleMerchant,
  useOnlineTokens: false, // Force l'utilisation de tokens offline
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.July25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
>>>>>>> 9e37be4 (push)
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
<<<<<<< HEAD
export const sessionStorage = shopify.sessionStorage;
=======
export const sessionStorage = shopify.sessionStorage;
>>>>>>> 9e37be4 (push)
