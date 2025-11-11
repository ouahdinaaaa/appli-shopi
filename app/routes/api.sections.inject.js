// Utilisation de Response.json() natif
import { authenticate } from "../shopify.server";
import { SectionManager } from "../sections/section-manager";

const sectionManager = new SectionManager();

export const action = async ({ request }) => {
  try {
    console.log('🚀 Début injection simplifiée...');
    
    const { admin } = await authenticate.admin(request);
    const { sectionName } = await request.json();
    
    if (!sectionName) {
      return Response.json({ error: "Nom de section requis" }, { status: 400 });
    }

    // 1. Lire le contenu de la section
    const sectionContent = await sectionManager.getSectionContent(sectionName);
    const cleanName = sectionName.replace('.liquid', '');
    
    console.log('📖 Section à injecter:', cleanName);

    // 2. Méthode SIMPLE et DIRECTE : Instructions manuelles
    // (Car l'injection automatique nécessite des permissions spéciales)
    return Response.json({
      success: true,
      message: `📋 Section "${cleanName}" prête pour installation manuelle`,
      data: {
        section: cleanName,
        content: sectionContent,
        steps: [
          `1. Allez sur: https://sectionaddict-dev.myshopify.com/admin/themes`,
          `2. Cliquez sur "Actions" → "Modifier le code"`,
          `3. Dans le dossier "sections", créez: ${cleanName}.liquid`,
          `4. Copiez le contenu Liquid ci-dessous:`,
          `5. Sauvegardez et utilisez la section!`
        ],
        content_length: sectionContent.length,
        file_path: `sections/${cleanName}.liquid`
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return Response.json({ 
      success: false, 
      error: `Erreur: ${error.message}` 
    }, { status: 500 });
  }
};