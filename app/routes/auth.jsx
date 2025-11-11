import { redirect } from "react-router-dom";
import { login } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  
  if (url.pathname === "/auth" || url.pathname === "/auth/") {
    return redirect("/auth/login");
  }
  
  return null;
};

export default function Auth() {
  // Cette route redirige vers /auth/login
  return null;
}
