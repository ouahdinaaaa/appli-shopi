import { uploadAsset } from "./api/assetApi.js";
import { readFileSync } from 'fs';
import { join } from 'path';

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const sectionId = formData.get('sectionId');
    const filename = formData.get('filename');
    const themeId = formData.get('themeId');

    // Lire le contenu du fichier .liquid
    const filePath = join(process.cwd(), 'app', 'routes', 'sections', filename);
    const content = readFileSync(filePath, 'utf8');

    const sectionData = {
      filename,
      content,
      themeId // Passer l'ID du thème sélectionné
    };

    const result = await uploadAsset(request, sectionData);
    
    // Utiliser Response au lieu de json()
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Section installée avec succès!",
      data: result 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error installing section:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erreur lors de l'installation: " + error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};