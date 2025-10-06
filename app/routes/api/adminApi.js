import { authenticate } from "../../shopify.server";

export async function uploadSection(shop, accessToken, themeId, sectionData) {
  const { admin } = await authenticate.admin();
  
  // Get active theme if themeId not provided
  if (!themeId) {
    const response = await admin.graphql(`
      query {
        themes(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `);
    const themes = await response.json();
    themeId = themes.data.themes.edges[0].node.id;
  }

  // Upload section using Asset API
  const response = await admin.rest.resources.Asset.create({
    session: res.locals.shopify.session,
    theme_id: themeId,
    asset: {
      key: `sections/${sectionData.filename}`,
      value: sectionData.content
    }
  });

  return response;
}