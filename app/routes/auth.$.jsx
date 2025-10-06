<<<<<<< HEAD
=======
import { boundary } from "@shopify/shopify-app-react-router/server";
>>>>>>> 9e37be4 (push)
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};
<<<<<<< HEAD
=======

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
>>>>>>> 9e37be4 (push)
