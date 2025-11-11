export const forceReinstallLoader = async ({ request }) => {
  try {
    console.log('🧹 NETTOYAGE FORCÉ...');
    
    // Tentative de récupération de la session pour nettoyage
    try {
      const { session } = await authenticate.admin(request);
      if (session) {
        console.log('🗑️ Nettoyage session:', session.shop);
        // Le sessionStorage sera nettoyé automatiquement à la réinstallation
      }
    } catch (e) {
      console.log('ℹ️ Aucune session à nettoyer');
    }
    
    return Response.json({
      success: true,
      message: "Instructions de réinstallation",
      steps: [
        "1. Allez dans votre admin Shopify",
        "2. Apps > App and sales channel settings",  
        "3. Trouvez SectionAddict et cliquez 'Uninstall'",
        "4. Confirmez la désinstallation",
        "5. Réinstallez via votre URL de développement",
        "6. Acceptez toutes les permissions demandées",
        "7. Testez avec /api/debug-auth"
      ],
      url: process.env.SHOPIFY_APP_URL,
      warning: "⚠️ La réinstallation effacera toutes les données de session"
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      message: "Nettoyage échoué mais continuez la réinstallation manuelle"
    });
  }
};