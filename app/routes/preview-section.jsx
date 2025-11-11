import fs from "fs/promises";
import path from "path";
import { Liquid } from "liquidjs";

const engine = new Liquid();

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const fileName = url.searchParams.get("fileName");
  if (!fileName) return new Response("Missing fileName", { status: 400 });

  // ⚠️ Chemin vers ton dossier sections (même logique que dans Index loader)
  const possiblePaths = [
    path.join(process.cwd(), "sections"),
    path.join(process.cwd(), "app", "sections"),
  ];

  let sectionsDir = null;
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      sectionsDir = testPath;
      break;
    } catch (err) {}
  }

  if (!sectionsDir) return new Response("Dossier sections introuvable", { status: 404 });

  const filePath = path.join(sectionsDir, fileName + ".liquid");
  try {
    const content = await fs.readFile(filePath, "utf8");

    // On peut rendre le Liquid avec des variables de démo si nécessaire
    const html = await engine.parseAndRender(content, {
      section: { settings: { title: "Titre de démo" } }
    });

    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (err) {
    console.error(err);
    return new Response("Fichier introuvable ou erreur", { status: 404 });
  }
};
