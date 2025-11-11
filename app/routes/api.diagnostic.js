// app/routes/api.diagnostic.js
// Utilisation de Response.json() natif
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    console.log('🩺 DIAGNOSTIC COMPLET...');
    
    // 1. Vérifications environnement
    const envCheck = {
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY?.substring(0, 8) + '...',
      SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? 'Present' : 'Missing',
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
      SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES
    };
    
    console.log('🔧 Environment:', envCheck);

    // 2. Test authentification
    let authResult;
    try {
      authResult = await authenticate.admin(request);
      console.log('✅ authenticate.admin() réussi');
    } catch (authError) {
      console.error('❌ authenticate.admin() échoué:', authError.message);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    const { admin, session } = authResult;
    
    console.log('📊 Session info:', {
      shop: session?.shop,
      hasAccessToken: !!session?.accessToken,
      tokenStart: session?.accessToken?.substring(0, 12) + '...',
      tokenLength: session?.accessToken?.length,
      isOnline: session?.isOnline,
      scope: session?.scope,
      id: session?.id
    });

    if (!session?.accessToken) {
      throw new Error('Session created but no access token found');
    }

    // 3. Test GraphQL simple (shop info)
    console.log('🧪 Test GraphQL simple...');
    const simpleQuery = `
      query {
        shop {
          name
          myshopifyDomain
        }
      }
    `;

    let shopResponse, shopData;
    try {
      shopResponse = await admin.graphql(simpleQuery);
      shopData = await shopResponse.json();
      console.log('📡 Shop response status:', shopResponse.status);
    } catch (graphqlError) {
      console.error('❌ GraphQL simple échoué:', graphqlError.message);
      throw new Error(`Simple GraphQL failed: ${graphqlError.message}`);
    }
    
    if (shopData.errors) {
      console.error('❌ Shop GraphQL errors:', shopData.errors);
      throw new Error(`Shop GraphQL errors: ${JSON.stringify(shopData.errors)}`);
    }

    // 4. Test permissions spécifiques (thèmes)
    console.log('🧪 Test permissions thèmes...');
    const themesQuery = `
      query {
        themes(first: 3) {
          edges {
            node {
              id
              name
              role
            }
          }
        }
      }
    `;

    let themesResponse, themesData;
    try {
      themesResponse = await admin.graphql(themesQuery);
      themesData = await themesResponse.json();
      console.log('📡 Themes response status:', themesResponse.status);
    } catch (themesError) {
      console.error('❌ Themes GraphQL échoué:', themesError.message);
      throw new Error(`Themes GraphQL failed: ${themesError.message}`);
    }
    
    if (themesData.errors) {
      console.error('❌ Themes GraphQL errors:', themesData.errors);
      return Response.json({
        success: false,
        error: 'PERMISSIONS_ERROR',
        message: 'Erreur de permissions pour accéder aux thèmes',
        details: {
          environment: envCheck,
          session: {
            shop: session.shop,
            hasToken: !!session.accessToken,
            scope: session.scope
          },
          shopQuery: 'SUCCESS',
          themesQuery: 'FAILED',
          themesErrors: themesData.errors
        },
        solution: 'Vérifiez que les scopes "read_themes,write_themes" sont bien configurés'
      }, { status: 403 });
    }

    // 5. Succès complet
    const shop = shopData.data.shop;
    const themes = themesData.data.themes.edges;
    
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Tous les tests sont passés !',
      results: {
        environment: envCheck,
        authentication: {
          status: 'OK',
          shop: session.shop,
          tokenLength: session.accessToken.length,
          scope: session.scope
        },
        shopInfo: {
          name: shop.name,
          domain: shop.myshopifyDomain
        },
        themes: {
          total: themes.length,
          list: themes.map(t => ({
            name: t.node.name,
            role: t.node.role,
            id: t.node.id
          }))
        }
      }
    });

  } catch (error) {
    console.error('💥 Diagnostic complet échoué:', error);
    
    return Response.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      type: error.name,
      stack: error.stack?.split('\n').slice(0, 5) // Premiers 5 lignes seulement
    }, { status: 500 });
  }
};