export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const exitIframe = url.searchParams.get("exitIframe");
  
  if (exitIframe) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: exitIframe,
        "X-Frame-Options": "DENY"
      }
    });
  }
  
  return new Response("Invalid exit iframe request", { status: 400 });
};
