import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    console.log('🔍 DEBUG TOKEN - Tentative d\'authentification...');
    
    const { session } = await authenticate.admin(request);
    
    console.log('🔍 Session trouvée:', {
      shop: session?.shop,
      hasToken: !!session?.accessToken,
      tokenStart: session?.accessToken?.substring(0, 10) + '...',
      isOnline: session?.isOnline
    });
    
    if (!session) {
      throw new Error('Aucune session trouvée - vous devez être connecté à l\'app Shopify');
    }
    
    if (!session.accessToken) {
      throw new Error('Aucun token d\'accès dans la session');
    }
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        shop: session.shop,
        token: session.accessToken,
        tokenType: session.accessToken?.startsWith('shpat_') ? 'Admin API Token' : 'App Access Token',
        isOnline: session.isOnline,
        scope: session.scope
      },
      instructions: {
        copyToEnv: `DEV_SHOP_DOMAIN=${session.shop}\nDEV_ADMIN_TOKEN=${session.accessToken}`,
        message: "Copiez ces valeurs dans votre fichier .env"
      }
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ DEBUG TOKEN - Erreur:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      suggestion: "Vous devez d'abord vous connecter à votre app Shopify depuis l'interface admin de Shopify"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
