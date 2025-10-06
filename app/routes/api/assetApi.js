import { authenticate } from "../../shopify.server";
import dotenv from "dotenv";

dotenv.config(); // Charge les variables du fichier .env

/**
 * Upload uniquement des sections dans 'sections/' du thème
 */
export async function uploadAsset(request, sectionData) {
  const { session } = await authenticate.admin(request);

  try {
    // Utilise les variables d'environnement si disponibles (mode développement privé)
    const shop = process.env.DEV_SHOP_DOMAIN || session.shop;
    const token = process.env.DEV_ADMIN_TOKEN || session.accessToken;

    // DEBUG: Afficher le token pour le copier dans .env
    if (!process.env.DEV_ADMIN_TOKEN && session.accessToken) {
      console.log('\n\n🔑 TOKEN À COPIER DANS .env :');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`DEV_ADMIN_TOKEN=${session.accessToken}`);
      console.log(`DEV_SHOP_DOMAIN=${session.shop}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 COPIEZ CES LIGNES DANS VOTRE FICHIER .env');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
    }
    
    // FORCER l'affichage même si DEV_ADMIN_TOKEN existe
    if (session.accessToken) {
      console.log('\n🔍 INFOS SESSION ACTUELLE:');
      console.log(`Shop: ${session.shop}`);
      console.log(`Token: ${session.accessToken.substring(0, 15)}...`);
      console.log(`Token Type: ${session.accessToken.startsWith('shpat_') ? 'Admin API' : 'App Token'}`);
    }

    if (!shop || !token) {
      throw new Error("Impossible de récupérer les informations de la boutique ou le token d'accès");
    }

  // Forcer le répertoire 'sections/'
  const filename = sectionData.filename.startsWith("sections/") 
    ? sectionData.filename 
    : `sections/${sectionData.filename}`;

  // Récupérer le thème principal si non fourni
  let themeId = sectionData.themeId;
  if (!themeId) {
    const themesResp = await fetch(`https://${shop}/admin/api/2025-07/themes.json`, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!themesResp.ok) {
      const text = await themesResp.text();
      throw new Error(`Impossible de récupérer les thèmes: ${themesResp.status} - ${text}`);
    }

    const themes = (await themesResp.json()).themes;
    themeId = themes.find((t) => t.role === "main")?.id || themes[0].id;
  }

  console.log(`Upload section ${filename} dans le thème ${themeId} pour la boutique ${shop}`);

  const apiUrl = `https://${shop}/admin/api/2025-07/themes/${themeId}/assets.json`;

  const resp = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ asset: { key: filename, value: sectionData.content } }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erreur upload section: ${resp.status} - ${text}`);
  }

  return (await resp.json()).asset;
  } catch (error) {
    console.error('Error uploading asset:', error);
    throw error;
  }
}

/**
 * Supprime une section dans 'sections/'
 */
export async function deleteSection(request, themeId, sectionFilename) {
  const { session } = await authenticate.admin(request);
  
  const shop = process.env.DEV_SHOP_DOMAIN || session.shop;
  const token = process.env.DEV_ADMIN_TOKEN || session.accessToken;
  const filename = sectionFilename.startsWith("sections/") 
    ? sectionFilename 
    : `sections/${sectionFilename}`;

  const url = `https://${shop}/admin/api/2025-07/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(filename)}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erreur delete section: ${resp.status} - ${text}`);
  }

  console.log(`Section supprimée: ${filename}`);
  return { success: true };
}

/**
 * Récupère une section dans 'sections/'
 */
export async function getSection(request, themeId, sectionFilename) {
  const { session } = await authenticate.admin(request);
  
  const shop = process.env.DEV_SHOP_DOMAIN || session.shop;
  const token = process.env.DEV_ADMIN_TOKEN || session.accessToken;
  const filename = sectionFilename.startsWith("sections/") 
    ? sectionFilename 
    : `sections/${sectionFilename}`;

  const url = `https://${shop}/admin/api/2025-07/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(filename)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erreur get section: ${resp.status} - ${text}`);
  }

  return (await resp.json()).asset;
}
