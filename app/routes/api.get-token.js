import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    console.log('🔐 RÉCUPÉRATION DU TOKEN...');
    
    const { session } = await authenticate.admin(request);
    
    if (session && session.accessToken) {
      console.log('\n🎉 TOKEN TROUVÉ !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`DEV_SHOP_DOMAIN=${session.shop}`);
      console.log(`DEV_ADMIN_TOKEN=${session.accessToken}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Copiez ces lignes dans votre fichier .env\n');
      
      return new Response(JSON.stringify({
        success: true,
        message: "Token affiché dans la console du serveur !",
        shop: session.shop,
        tokenPrefix: session.accessToken.substring(0, 10) + "..."
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Pas de token dans la session');
    }
  } catch (error) {
    console.error('❌ Erreur récupération token:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
