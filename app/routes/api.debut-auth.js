import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    console.log('🕵️ DIAGNOSTIC COMPLET DE L\'AUTHENTIFICATION');
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Étape 1: Test d'authentification basique
    let authResult;
    try {
      authResult = await authenticate.admin(request);
      console.log('✅ Authenticate.admin réussi');
    } catch (authError) {
      console.error('❌ Authenticate.admin échoué:', authError.message);
      return json({
        success: false,
        step: 'authentication',
        error: authError.message,
        solution: "L'authentification Shopify a échoué. Vérifiez l'installation de l'app."
      }, { status: 401 });
    }
    
    const { admin, session } = authResult;
    
    // Étape 2: Analyse détaillée de la session
    const sessionDetails = {
      exists: !!session,
      shop: session?.shop,
      accessToken: session?.accessToken ? {
        exists: true,
        length: session.accessToken.length,
        prefix: session.accessToken.substring(0, 10) + '...',
        type: session.accessToken.startsWith('shpat_') ? 'private' : 
              session.accessToken.startsWith('shpca_') ? 'custom' : 'unknown'
      } : { exists: false },
      isOnline: session?.isOnline,
      scope: session?.scope,
      state: session?.state,
      expires: session?.expires,
      id: session?.id
    };
    
    console.log('📊 Session détails:', JSON.stringify(sessionDetails, null, 2));
    
    // Étape 3: Test GraphQL simple
    let graphqlTest = { success: false, error: null, data: null };
    try {
      const simpleQuery = `query { shop { name myshopifyDomain } }`;
      const response = await admin.graphql(simpleQuery);
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }
      
      graphqlTest = {
        success: true,
        data: data.data
      };
      console.log('✅ GraphQL test réussi:', data.data);
      
    } catch (error) {
      graphqlTest.error = error.message;
      console.error('❌ GraphQL test échoué:', error.message);
    }
    
    // Étape 4: Test REST API direct
    let restTest = { success: false, error: null, data: null };
    if (session?.accessToken && session?.shop) {
      try {
        const shopUrl = `https://${session.shop}/admin/api/2025-01/shop.json`;
        
        const response = await fetch(shopUrl, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': session.accessToken,
            'Content-Type': 'application/json',
            'User-Agent': 'SectionAddict-Debug/1.0'
          }
        });
        
        console.log('🌐 REST Response status:', response.status);
        console.log('🌐 REST Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        restTest = {
          success: true,
          data: {
            name: data.shop?.name,
            domain: data.shop?.myshopify_domain,
            plan: data.shop?.plan_name
          }
        };
        console.log('✅ REST test réussi:', restTest.data);
        
      } catch (error) {
        restTest.error = error.message;
        console.error('❌ REST test échoué:', error.message);
      }
    }
    
    // Étape 5: Vérification environnement
    const envCheck = {
      apiKey: !!process.env.SHOPIFY_API_KEY,
      apiSecret: !!process.env.SHOPIFY_API_SECRET,
      scopes: process.env.SHOPIFY_SCOPES,
      appUrl: process.env.SHOPIFY_APP_URL,
      nodeEnv: process.env.NODE_ENV
    };
    
    // Diagnostic final
    const issues = [];
    if (!sessionDetails.exists) issues.push("Session manquante");
    if (!sessionDetails.accessToken.exists) issues.push("Access token manquant");
    if (!sessionDetails.shop) issues.push("Shop manquant");
    if (!graphqlTest.success) issues.push("GraphQL inaccessible");
    if (!restTest.success) issues.push("REST API inaccessible");
    
    const recommendations = [];
    if (issues.length === 0) {
      recommendations.push("✅ Tout semble fonctionnel!");
    } else {
      if (issues.includes("Session manquante")) {
        recommendations.push("🔴 Réinstallez complètement l'application");
      }
      if (issues.includes("Access token manquant")) {
        recommendations.push("🔴 Problème d'autorisation - vérifiez les scopes");
      }
      if (issues.includes("GraphQL inaccessible") && restTest.success) {
        recommendations.push("🟡 Utilisez REST API à la place de GraphQL");
      }
      if (!restTest.success && !graphqlTest.success) {
        recommendations.push("🔴 Token invalide ou permissions insuffisantes");
      }
    }
    
    return json({
      success: issues.length === 0,
      timestamp: new Date().toISOString(),
      session: sessionDetails,
      tests: {
        graphql: graphqlTest,
        rest: restTest
      },
      environment: envCheck,
      issues,
      recommendations,
      nextSteps: issues.length === 0 
        ? ["Testez l'injection de section"]
        : ["Suivez les recommandations ci-dessus", "Consultez les logs serveur"]
    });
    
  } catch (error) {
    console.error('💥 Erreur diagnostic:', error);
    
    return json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      message: "Diagnostic complet échoué"
    }, { status: 500 });
  }
};
