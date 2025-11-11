import fs from 'fs';
import path from 'path';

export const loader = async () => {
  const sectionsDir = path.join(process.cwd(), "sections");
  const sectionItems = [];
  
  // Fonction pour parser un fichier Liquid
  const parseLiquidSection = (content, filename, category, fullPath) => {
    try {
      const schemaMatch = content.match(/{% schema %}([\s\S]*?){% endschema %}/);
      let schema = {};
      
      if (schemaMatch) {
        try {
          schema = JSON.parse(schemaMatch[1]);
        } catch (e) {
          console.error(`Erreur parsing schema pour ${filename}:`, e);
        }
      }
      
      return {
        id: filename.replace('.liquid', ''),
        name: schema.name || filename.replace('.liquid', '').replace(/-/g, ' '),
        description: schema.description || `Section ${category}`,
        category: category,
        price: 15,
        image: `/images/${category || 'default'}.jpg`,
        filePath: fullPath.replace(process.cwd(), ''),
        liquidCode: content,
        previewHtml: generatePreviewFromLiquid(content, schema)
      };
    } catch (error) {
      console.error(`Erreur parsing section ${filename}:`, error);
      return null;
    }
  };
  
  // Fonction pour générer l'aperçu
  const generatePreviewFromLiquid = (liquidCode, schema) => {
    if (liquidCode.includes('hero-banner') || liquidCode.includes('banner')) {
      return `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; border-radius: 8px;">
        <h1>${schema.settings?.find(s => s.id === 'title')?.default || 'Bannière'}</h1>
        <p>Description de la bannière</p>
      </div>`;
    }
    
    return `<div style="padding: 20px; text-align: center; border: 2px dashed #ddd; border-radius: 8px;">
      <h3>${schema.name || 'Section'}</h3>
      <p>Aperçu de la section</p>
    </div>`;
  };
  
  // Fonction récursive pour lire les sections
  const readSections = (dir, category = "") => {
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          readSections(fullPath, item);
        } else if (item.endsWith('.liquid')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const section = parseLiquidSection(content, item, category, fullPath);
          if (section) {
            sectionItems.push(section);
          }
        }
      });
    } catch (error) {
      console.error(`Erreur lecture dossier ${dir}:`, error);
    }
  };
  
  try {
    if (fs.existsSync(sectionsDir)) {
      readSections(sectionsDir);
    }
  } catch (error) {
    console.error("Erreur lors de la lecture des sections:", error);
  }
  
  return Response.json({ sections: sectionItems });
};