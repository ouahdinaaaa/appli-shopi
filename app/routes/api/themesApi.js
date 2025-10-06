import { authenticate } from "../../shopify.server";

export async function getThemes(request) {
  const { admin, session } = await authenticate.admin(request);

  try {
    // Essayons d'abord avec l'API REST
    const themesRestResponse = await fetch(`https://${session.shop}/admin/api/2025-07/themes.json`, {
      headers: {
        'X-Shopify-Access-Token': session.accessToken,
        'Content-Type': 'application/json',
      }
    });

    if (themesRestResponse.ok) {
      const themesRestData = await themesRestResponse.json();
      return themesRestData.themes;
    }

    // Si l'API REST échoue, essayons GraphQL
    console.log('API REST échoué, essai avec GraphQL...');
    const themesGraphQLResponse = await admin.graphql(`
      #graphql
      query getThemes {
        themes(first: 20) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `);

    const themesGraphQLData = await themesGraphQLResponse.json();
    
    if (themesGraphQLData.data && themesGraphQLData.data.themes) {
      // Convertir les thèmes GraphQL au format REST pour compatibilité
      return themesGraphQLData.data.themes.edges.map(edge => ({
        id: edge.node.id.split('/').pop(), // Extraire l'ID numérique
        name: edge.node.name,
        role: edge.node.id.includes('main') ? 'main' : 'unpublished' // Approximation
      }));
    }

    throw new Error('Impossible de récupérer les thèmes avec les deux APIs');

  } catch (error) {
    console.error('Erreur lors de la récupération des thèmes:', error);
    throw error;
  }
}
