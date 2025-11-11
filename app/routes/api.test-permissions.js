// Utilisation de Response.json() natif
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    console.log('🧪 Test permissions complètes...');
    
    const { admin, session } = await authenticate.admin(request);
    
    // Test 1: Informations session
    const sessionInfo = {
      shop: session?.shop,
      hasToken: !!session?.accessToken,
      isOnline: session?.isOnline,
      scope: session?.scope,
      tokenLength: session?.accessToken?.length || 0
    };
    
    console.log('📋 Session info:', sessionInfo);
    
    // Test 2: Accès aux thèmes (lecture)
    let themesTest = { success: false, error: null };
    try {
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
      
      const themesResponse = await admin.graphql(themesQuery);
      const themesData = await themesResponse.json();
      
      if (themesData.errors) {
        throw new Error(JSON.stringify(themesData.errors));
      }
      
      themesTest = {
        success: true,
        count: themesData.data?.themes?.edges?.length || 0,
        themes: themesData.data?.themes?.edges?.map(e => e.node) || []
      };
      
    } catch (error) {
      themesTest.error = error.message;
    }
    
    // Test 3: Test REST API
    let restTest = { success: false, error: null };
    try {
      const mainTheme = themesTest.themes?.find(t => t.role === 'MAIN');
      if (mainTheme && session.accessToken) {
        const restUrl = `https://${session.shop}/admin/api/2025-07/themes.json`;
        
        const response = await fetch(restUrl, {
          headers: {
            'X-Shopify-Access-Token': session.accessToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          restTest.success = true;
          restTest.message = "REST API accessible";
        } else {
          const errorText = await response.text();
          throw new Error(`Status: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      restTest.error = error.message;
    }
    
    return Response.json({
      success: true,
      tests: {
        session: sessionInfo,
        themes: themesTest,
        restApi: restTest
      },
      recommendations: [
        !sessionInfo.hasToken ? "🔴 Token manquant - réinstallez l'app" : "✅ Token OK",
        !sessionInfo.scope?.includes('write_themes') ? "🔴 Scope write_themes manquant" : "✅ Permissions OK", 
        !themesTest.success ? "🔴 Accès thèmes impossible" : "✅ Accès thèmes OK",
        !restTest.success ? "🔴 REST API inaccessible" : "✅ REST API OK"
      ],
      message: "Tests de permissions terminés"
    });
    
  } catch (error) {
    console.error('❌ Test permissions échoué:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      details: error.stack,
      message: "Tests de permissions échoués"
    }, { status: 401 });
  }
};