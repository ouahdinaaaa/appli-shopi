import { json } from "@remix-run/node";
import { SectionManager } from "../sections/section-manager";

const sectionManager = new SectionManager();

export const loader = async () => {
  try {
    const sections = await sectionManager.getAvailableSections();
    
    return json({ 
      success: true, 
      sections,
      count: sections.length,
      message: `${sections.length} section(s) disponible(s)`
    });
  } catch (error) {
    return json({ 
      success: false, 
      sections: [], 
      error: error.message 
    });
  }
};