import fs from 'fs/promises';
import path from 'path';

export class SectionManager {
  constructor() {
    this.templatesPath = path.join(process.cwd(), 'app', 'sections', 'templates');
  }

  // Retourne la liste des fichiers liquid
  async getAvailableSections() {
    try {
      const files = await fs.readdir(this.templatesPath);
      const liquidFiles = files.filter(file => file.endsWith('.liquid'));
      console.log('📁 Sections trouvées:', liquidFiles);
      return liquidFiles;
    } catch (error) {
      console.error('❌ Erreur lecture sections:', error);
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  // Retourne les noms des sections sans l'extension .liquid
  async getSectionNamesWithoutExtension() {
    const files = await this.getAvailableSections();
    return files.map(file => file.replace('.liquid', ''));
  }

  // Lecture du contenu d'une section
  async getSectionContent(sectionName) {
    try {
      const cleanName = sectionName.replace('.liquid', '');
      const filePath = path.join(this.templatesPath, `${cleanName}.liquid`);
      console.log('📖 Lecture section:', filePath);

      const content = await fs.readFile(filePath, 'utf-8');
      this.validateSectionContent(content);
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Section "${sectionName}" non trouvée`);
      }
      throw new Error(`Erreur lecture section: ${error.message}`);
    }
  }

  // Validation du contenu d'une section
  validateSectionContent(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('Le contenu de la section est vide');
    }
    return true;
  }
}
