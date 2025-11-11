import { useState, useEffect, useRef } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  Text,
  Button,
  Badge,
  Checkbox,
  TextField,
  Modal,
  Toast,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

// Cache global pour éviter de relire les fichiers à chaque requête
let sectionsCache = null;
let categoriesCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Catégories statiques pour le carrousel (optionnel)
const categories = [
  { name: "Bannières", slug: "bannieres", image: "/images/banner.jpg" },
  { name: "Sliders", slug: "sliders", image: "/images/slider.jpg" },
  { name: "Before/After", slug: "before-after", image: "/images/beforeafter.jpg" },
  { name: "Comparatifs", slug: "comparatifs", image: "/images/comparatif.jpg" },
];

// 🔍 Barre de recherche et filtres DYNAMIQUES
function SearchAndFilters({ onSearch, onFilter, selectedCategories, availableCategories = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [tempCategories, setTempCategories] = useState(selectedCategories);

  // Synchronize tempCategories when selectedCategories change
  useEffect(() => {
    setTempCategories(selectedCategories);
  }, [selectedCategories]);

  // Utiliser les catégories dynamiques détectées au lieu des statiques
  const categoriesList = availableCategories.map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
  }));

  const handleCategoryChange = (categoryValue, checked) => {
    if (checked) {
      setTempCategories([...tempCategories, categoryValue]);
    } else {
      setTempCategories(tempCategories.filter(cat => cat !== categoryValue));
    }
  };

  const applyFilters = () => {
    onFilter(tempCategories);
    setShowCategories(false);
  };

  const clearFilters = () => {
    setTempCategories([]);
    onFilter([]);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <TextField
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              onSearch(value);
            }}
            placeholder="Rechercher une section..."
            autoComplete="off"
          />
        </div>
        <Button onClick={() => setShowCategories(true)}>
          Catégories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
        </Button>
      </div>

      <Modal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        title="Filtrer par catégories"
        primaryAction={{ content: 'Appliquer', onAction: applyFilters }}
        secondaryActions={[{ content: 'Effacer tout', onAction: clearFilters }]}
      >
        <Modal.Section>
          {categoriesList.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {categoriesList.map(category => (
                <Checkbox
                  key={category.value}
                  label={category.label}
                  checked={tempCategories.includes(category.value)}
                  onChange={(checked) => handleCategoryChange(category.value, checked)}
                />
              ))}
            </div>
          ) : (
            <Text color="subdued">Aucune catégorie trouvée dans le dossier sections/</Text>
          )}
        </Modal.Section>
      </Modal>
    </div>
  );
}


// 🎭 Modal de démonstration avec iframe pour rendu réel
function DemoModal({ section, isOpen, onClose }) {
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const iframeRef = useRef(null);

  // --- NEW: Assainir le JSON du schema (retirer virgules traînantes, commentaires) ---
  const sanitizeSchemaJSON = (raw) => {
    let s = raw;
    // Retirer commentaires //… et /* … */
    s = s.replace(/\/\/[^\n\r]*/g, '');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    // Retirer virgules traînantes avant } ou ]
    s = s.replace(/,\s*([}\]])/g, '$1');
    // Trim
    s = s.trim();
    return s;
  };

  // Utilitaire d'accès aux valeurs imbriquées
  const getValueFromPath = (path, context) => {
    const keys = path.split('.');
    let current = context;
    for (let i = 0; i < keys.length; i++) {
      if (current == null) return undefined;
      current = current[keys[i]];
    }
    return current;
  };

  // Parse schema: utilise exactement le nombre de blocs du preset (robuste au JSON non strict)
  const parseSchema = (liquidCode) => {
    const schemaMatch = liquidCode.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
    if (!schemaMatch) return { settings: {}, blocks: [], presetCount: 0 };

    try {
      const cleaned = sanitizeSchemaJSON(schemaMatch[1]);
      const schema = JSON.parse(cleaned);

      const settings = {};
      let blocks = [];
      let presetCount = 0;

      // Defaults des settings de section
      if (Array.isArray(schema.settings)) {
        schema.settings.forEach(s => {
          if (s && s.id) {
            if (s.default !== undefined) {
              settings[s.id] = s.default;
            } else if (s.type === 'url') {
              // NEW: valeur neutre pour rendre les boutons en preview
              settings[s.id] = '#';
            }
          }
        });
      }

      // Map type de bloc -> defaults
      const typeDefaults = new Map();
      if (Array.isArray(schema.blocks)) {
        schema.blocks.forEach(b => {
          const def = {};
          if (Array.isArray(b.settings)) {
            b.settings.forEach(s => {
              if (s && s.id && s.default !== undefined) def[s.id] = s.default;
            });
          }
          typeDefaults.set(b.type, def);
        });
      }

      // Utiliser EXACTEMENT les presets (même si pas de settings dans le preset)
      const presetBlocks = (schema.presets && schema.presets.length > 0 && Array.isArray(schema.presets[0].blocks))
        ? schema.presets[0].blocks
        : null;

      if (presetBlocks && presetBlocks.length > 0) {
        presetCount = presetBlocks.length; // ✅ 3 pour banniere1, 5 pour accordion-collection, etc.
        blocks = presetBlocks.map(pb => {
          const base = typeDefaults.get(pb.type) || {};
          return { ...base, ...(pb.settings || {}) };
        });
      } else if (Array.isArray(schema.blocks) && schema.blocks.length > 0) {
        // Fallback si pas de preset: count borné par max_blocks
        const base = typeDefaults.get(schema.blocks[0].type) || {};
        const count = Math.min(schema.max_blocks ?? 3, 12);
        presetCount = count;
        for (let i = 0; i < count; i++) blocks.push({ ...base });
      }

      return { settings, blocks, presetCount };
    } catch (e) {
      console.error('Erreur parsing schema:', e);
      return { settings: {}, blocks: [], presetCount: 0 };
    }
  };

  // --- Extraction robuste: capture case forloop.index OU case idx ---
  const extractCaseDefaults = (liquid) => {
    const res = { bg: {}, media: {}, image: {} };
    // ✅ Support forloop.index ET idx (et autres noms de variable)
    const caseMatch = liquid.match(/\{%-?\s*case\s+(forloop\.index|idx|[\w.]+)\s*-?%\}([\s\S]*?)\{%-?\s*endcase\s*-?%\}/);
    if (!caseMatch) {
      console.log('❌ extractCaseDefaults: aucun case/endcase trouvé');
      return res;
    }

    const caseVar = caseMatch[1]; // "forloop.index" ou "idx"
    const body = caseMatch[2];
    console.log(`✅ extractCaseDefaults: case ${caseVar} trouvé, body longueur:`, body.length);

    // ✅ Regex qui capture TOUS les when (1, 2, 3, 4, 5…)
    const whenRegex = /\{%-?\s*when\s+['"]?(\d+)['"]?\s*-?%\}([\s\S]*?)(?=\{%-?\s*(?:when|else|endcase))/g;
    let m;
    while ((m = whenRegex.exec(body)) !== null) {
      const key = parseInt(m[1], 10);
      const content = m[2] || '';
      console.log(`🔍 When ${key} trouvé, contenu longueur:`, content.length);

      // Chercher TOUS les assigns default_* avec matchAll (global)
      const bgMatches = [...content.matchAll(/\{%-?\s*assign\s+default_bg\s*=\s*['"]([^'"]+)['"]\s*.*?-?%\}/g)];
      const mediaMatches = [...content.matchAll(/\{%-?\s*assign\s+default_media\s*=\s*['"]([^'"]+)['"]\s*.*?-?%\}/g)];
      const imageMatches = [...content.matchAll(/\{%-?\s*assign\s+default_image\s*=\s*['"]([^'"]+)['"]\s*.*?-?%\}/g)];

      console.log(`  → When ${key}: ${bgMatches.length} default_bg, ${mediaMatches.length} default_media, ${imageMatches.length} default_image`);

      if (bgMatches.length > 0) {
        res.bg[key] = bgMatches[bgMatches.length - 1][1];
        console.log(`    ✅ default_bg[${key}] =`, res.bg[key]);
      }
      if (mediaMatches.length > 0) {
        res.media[key] = mediaMatches[mediaMatches.length - 1][1];
        console.log(`    ✅ default_media[${key}] =`, res.media[key]);
      }
      if (imageMatches.length > 0) {
        res.image[key] = imageMatches[imageMatches.length - 1][1];
        console.log(`    ✅ default_image[${key}] =`, res.image[key]);
      }
    }

    console.log('📦 extractCaseDefaults final:', res);
    return res;
  };

  // --- NEW: Extraction pour assigns globaux (before/after carousel) ---
  const extractGlobalBeforeAfter = (liquid) => {
    const res = { before: {}, after: {} };
    
    // Chercher tous les assigns default_before_X et default_after_X AVANT la boucle
    const beforeMatches = [...liquid.matchAll(/\{%-?\s*assign\s+default_before_(\d+)\s*=\s*['"]([^'"]+)['"]\s*.*?-?%\}/g)];
    const afterMatches = [...liquid.matchAll(/\{%-?\s*assign\s+default_after_(\d+)\s*=\s*['"]([^'"]+)['"]\s*.*?-?%\}/g)];
    
    beforeMatches.forEach(m => {
      const key = parseInt(m[1], 10);
      res.before[key] = m[2];
      console.log(`✅ default_before_${key} =`, m[2]);
    });
    
    afterMatches.forEach(m => {
      const key = parseInt(m[1], 10);
      res.after[key] = m[2];
      console.log(`✅ default_after_${key} =`, m[2]);
    });
    
    console.log('📦 extractGlobalBeforeAfter final:', res);
    return res;
  };

  // Conversion Liquid → HTML
  const liquidToHtml = (liquidCode) => {
    const { settings, blocks, presetCount } = parseSchema(liquidCode);
    const caseDefaults = extractCaseDefaults(liquidCode);
    const globalBeforeAfter = extractGlobalBeforeAfter(liquidCode);

    let html = liquidCode;

    // 1) Extraire les arrays par défaut
    const defaultImagesMatch = liquidCode.match(/\{%-?\s*assign\s+default_images\s*=\s*["']([^"']+)["']\s*\|\s*split:\s*["']([^"']+)["']\s*-?%\}/);
    let defaultImages = [];
    if (defaultImagesMatch && defaultImagesMatch[1]) {
      const sep = defaultImagesMatch[2] || ',';
      defaultImages = defaultImagesMatch[1].split(sep).map(s => s.trim());
    }

    const beforeImagesMatch = liquidCode.match(/\{%-?\s*assign\s+default_before_images\s*=\s*["']([^"']+)["']\s*\|\s*split:\s*["']([^"']+)["']\s*-?%\}/);
    let defaultBeforeImages = [];
    if (beforeImagesMatch && beforeImagesMatch[1]) {
      const sep = beforeImagesMatch[2] || ',';
      defaultBeforeImages = beforeImagesMatch[1].split(sep).map(s => s.trim());
    }

    const afterImagesMatch = liquidCode.match(/\{%-?\s*assign\s+default_after_images\s*=\s*["']([^"']+)["']\s*\|\s*split:\s*["']([^"']+)["']\s*-?%\}/);
    let defaultAfterImages = [];
    if (afterImagesMatch && afterImagesMatch[1]) {
      const sep = afterImagesMatch[2] || ',';
      defaultAfterImages = afterImagesMatch[1].split(sep).map(s => s.trim());
    }

    // 2) Nettoyage: retirer schema, assigns et commentaires Liquid
    html = html.replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/g, '');
    html = html.replace(/\{%-?\s*assign\s+default_images.*?%}/g, '');
    html = html.replace(/\{%-?\s*assign\s+default_before_images.*?%}/g, '');
    html = html.replace(/\{%-?\s*assign\s+default_after_images.*?%}/g, '');
    // NEW: supprimer entièrement les commentaires Liquid (évite le texte "Image vignette...")
    html = html.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
    html = html.replace(/\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/g, '');

    // Helpers d'évaluation (isBlank, evalSingle, evalLogical, resolveIfChains déjà définis)
    const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    
    const evalSingle = (cond, ctx, localVars = {}) => {
      const tokens = (cond || '').trim().split(/\s+/);
      const left = tokens[0] || '';
      const op = tokens[1];
      const right = tokens.slice(2).join(' ');

      const hasLocal = Object.prototype.hasOwnProperty.call(localVars, left);
      const value = hasLocal ? localVars[left] : getValueFromPath(left, ctx);

      if (!op) return !!value;

      const rhs = right.replace(/^['"]|['"]$/g, '');

      // NEW: comparateurs numériques
      const numOps = new Set(['>', '<', '>=', '<=']);
      if (numOps.has(op)) {
        const lv = Number(value);
        const rv = Number(rhs);
        if (Number.isNaN(lv) || Number.isNaN(rv)) return false;
        if (op === '>') return lv > rv;
        if (op === '<') return lv < rv;
        if (op === '>=') return lv >= rv;
        if (op === '<=') return lv <= rv;
      }

      if ((op === '==' || op === '!=') && rhs === 'blank') {
        const res = isBlank(value);
        return op === '==' ? res : !res;
      }
      if (op === '==' || op === '!=') {
        const res = String(value ?? '') === rhs;
        return op === '==' ? res : !res;
      }
      return !!value;
    };
    
    const evalLogical = (cond, ctx, localVars = {}) => {
      // support minimal: "A and B" chaîné
      const parts = String(cond || '').split(/\s+and\s+/i);
      return parts.every(p => evalSingle(p, ctx, localVars));
    };
    
    const resolveIfChains = (src, ctx, localVars = {}) => {
      return src.replace(/\{%-?\s*if\s+([\s\S]*?)\s*-?%\}([\s\S]*?)\{%-?\s*endif\s*-?%\}/g, (m, firstCond, inner) => {
        const clauses = [];
        let elseContent = '';
        let cursor = 0;
        let currentCond = firstCond;
        const tagRe = /\{%-?\s*elsif\s+([\s\S]*?)\s*-?%\}|\{%-?\s*else\s*-?%\}/g;
        let t;
        while ((t = tagRe.exec(inner)) !== null) {
          const contentChunk = inner.slice(cursor, t.index);
          clauses.push({ cond: currentCond, content: contentChunk });
          cursor = t.index + t[0].length;
          if (t[1] !== undefined) {
            currentCond = t[1];
          } else {
            elseContent = inner.slice(cursor);
            cursor = inner.length;
            break;
          }
        }
        if (cursor < inner.length && elseContent === '') {
          clauses.push({ cond: currentCond, content: inner.slice(cursor) });
        }

        for (const c of clauses) {
          if (evalLogical(c.cond, ctx, localVars)) return c.content;
        }
        return elseContent || '';
      });
    };

    // 3) Boucle des blocks
    const forRegex = /\{%-?\s*for\s+block\s+in\s+section\.blocks\s*-?%\}([\s\S]*?)\{%-?\s*endfor\s*-?%\}/;
    const forMatch = html.match(forRegex);

    if (forMatch) {
      const [fullMatch, blockContent] = forMatch;
      let blocksHtml = '';
      const useBlocks = blocks.length > 0 ? blocks : Array.from({ length: presetCount || 3 }, () => ({}));

      useBlocks.forEach((blockDefaults, index) => {
        let current = blockContent;

        const ctx = {
          section: { settings },
          block: { settings: blockDefaults },
          forloop: { index: index + 1, index0: index }
        };

        // Local vars pour ce block
        const localVars = {};

        // Helper lecture ref (corrige ReferenceError: localVars is not defined)
        const readRef = (path) => {
          if (Object.prototype.hasOwnProperty.call(localVars, path)) return localVars[path];
          return getValueFromPath(path, ctx);
        };

        // ✅ NEW: supporter "case idx" (card-diago) en mappant idx = forloop.index
        current = current.replace(/\{%-?\s*assign\s+idx\s*=\s*forloop\.index\s*-?%\}/g, '');
        // Maintenant on traite le case comme si c'était "case forloop.index"
        
        // case/when (remplace le when sélectionné par son contenu)
        current = current.replace(/\{%-?\s*case\s+(forloop\.index|idx|[\w.]+)\s*-?%\}([\s\S]*?)\{%-?\s*endcase\s*-?%\}/g, (match, caseExpr, caseBody) => {
          // Si c'est "idx", on l'évalue comme forloop.index
          const caseKey = (caseExpr === 'idx') ? 'forloop.index' : caseExpr;
          const caseVal = getValueFromPath(caseKey, ctx);
          
          let selected = '';
          const whenRegex = /\{%-?\s*when\s+([^\r\n%]+?)\s*-?%\}([\s\S]*?)(?=\{%-?\s*(?:when|else|endcase))/g;
          let m;
          while ((m = whenRegex.exec(caseBody)) !== null) {
            const whenCond = m[1].trim().replace(/^['"]|['"]$/g, '');
            const whenContent = m[2];
            if (String(caseVal) === whenCond || Number(caseVal) === Number(whenCond)) {
              selected = whenContent;
              break;
            }
          }
          if (!selected) {
            const elseMatch = caseBody.match(/\{%-?\s*else\s*-?%\}([\s\S]*)$/);
            if (elseMatch) selected = elseMatch[1];
          }
          return selected || '';
        });

        // Assigns locaux
        current = current.replace(/\{%-?\s*assign\s+([\w-]+)\s*=\s*(.*?)\s*-?%\}/g, (m, name, expr) => {
          const e = expr.trim();

          if (/forloop\.index0\s*\|\s*modulo:\s*default_images\.size/.test(e)) {
            localVars[name] = String(defaultImages.length ? (index % defaultImages.length) : 0);
            return '';
          }
          if (/forloop\.index0\s*\|\s*modulo:\s*default_before_images\.size/.test(e)) {
            localVars[name] = String(defaultBeforeImages.length ? (index % defaultBeforeImages.length) : 0);
            return '';
          }
          if (/forloop\.index0\s*\|\s*modulo:\s*default_after_images\.size/.test(e)) {
            localVars[name] = String(defaultAfterImages.length ? (index % defaultAfterImages.length) : 0);
            return '';
          }

          const mm = e.match(/forloop\.index0\s*\|\s*modulo:\s*(\d+)/);
          if (mm) { localVars[name] = String(index % parseInt(mm[1], 10)); return ''; }

          if (/\bdefault_images\[\s*forloop\.index0\s*\]/.test(e)) {
            localVars[name] = defaultImages[index % defaultImages.length] || '';
            return '';
          }
          if (/\bdefault_before_images\[\s*image_index\s*\]/.test(e)) {
            const i = parseInt(localVars.image_index ?? index, 10) || 0;
            localVars[name] = defaultBeforeImages[i % defaultBeforeImages.length] || '';
            return '';
          }
          if (/\bdefault_before_images\[\s*forloop\.index0\s*\]/.test(e)) {
            localVars[name] = defaultBeforeImages[index % defaultBeforeImages.length] || '';
            return '';
          }
          if (/\bdefault_after_images\[\s*image_index\s*\]/.test(e)) {
            const i = parseInt(localVars.image_index ?? index, 10) || 0;
            localVars[name] = defaultAfterImages[i % defaultAfterImages.length] || '';
            return '';
          }
          if (/\bdefault_after_images\[\s*forloop\.index0\s*\]/.test(e)) {
            localVars[name] = defaultAfterImages[index % defaultAfterImages.length] || '';
            return '';
          }

          if (/\bdefault_images\[\s*image_index\s*\]/.test(e)) {
            const i = parseInt(localVars.image_index ?? index, 10) || 0;
            localVars[name] = defaultImages[i % defaultImages.length] || '';
            return '';
          }
          const dm = e.match(/default_images\[(\d+)\]/);
          if (dm) {
            localVars[name] = defaultImages[parseInt(dm[1], 10)] || '';
            return '';
          }

          const literalWithPipe = e.match(/^['"]([^'"]+)['"](\s*\|.*)?$/);
          if (literalWithPipe) { localVars[name] = literalWithPipe[1]; return ''; }

          const q = e.match(/^['"]([^'"]+)['"]$/);
          if (q) { localVars[name] = q[1]; return ''; }

          const varRef = e.split('|')[0].trim();
          const refLocal = readRef(varRef);
          if (refLocal !== undefined && refLocal !== null && String(refLocal) !== '') {
            localVars[name] = String(refLocal);
            return '';
          }
          if (Object.prototype.hasOwnProperty.call(localVars, varRef)) {
            localVars[name] = localVars[varRef];
            return '';
          }

          localVars[name] = '';
          return '';
        });

        // --- Fallbacks depuis extractCaseDefaults ---
        const slideNo = index + 1;
        if (!localVars.default_bg || localVars.default_bg === '') {
          localVars.default_bg = caseDefaults.bg[slideNo] || '';
        }
        if (!localVars.default_media || localVars.default_media === '') {
          localVars.default_media = caseDefaults.media[slideNo] || '';
        }
        if (!localVars.default_image || localVars.default_image === '') {
          localVars.default_image = caseDefaults.image[slideNo] || '';
        }

        // NEW: Fallbacks produits UNIQUEMENT si c’est un layout product-grid détectable dans le fichier
        const isProductSection = /featured-products-|class="product-card"|id="products-scroll-/.test(liquidCode);
        if (isProductSection) {
          const idx = defaultBeforeImages.length ? (index % defaultBeforeImages.length) : 0;
          if (!localVars.image_index) localVars.image_index = String(idx);
          if (!localVars.thumb_src || localVars.thumb_src === '') {
            localVars.thumb_src = defaultBeforeImages[idx] || '';
          }
          if (!localVars.hero_src || localVars.hero_src === '') {
            localVars.hero_src = (defaultAfterImages.length ? defaultAfterImages[idx] : '') || localVars.thumb_src || '';
          }
          if (!localVars.card_title || localVars.card_title === '') {
            localVars.card_title = `Produit ${index + 1}`;
          }
        }

        // If/elsif/else
        current = resolveIfChains(current, ctx, localVars);

        // default_images indexés
        if (defaultImages.length > 0) {
          const imgUrl = defaultImages[index % defaultImages.length] || '';
          current = current
            .replace(/\{\{\s*default_images\[\s*forloop\.index0\s*\]\s*\}\}/g, imgUrl)
            .replace(/\{\{\s*default_images\[\s*forloop\.index\s*\]\s*\}\}/g, defaultImages[(index + 1) % defaultImages.length] || '')
            .replace(/\{\{\s*default_images\[\s*image_index\s*\]\s*\}\}/g, imgUrl);
        }

        // Variables dans le bloc (incluant thumb_src/hero_src)
        current = current.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, expr) => {
          const varExpr = expr.split('|')[0].trim();

          // NEW: hero_initial → after[0] puis before[0]
          if (varExpr === 'hero_initial') {
            return (defaultAfterImages[0] || defaultBeforeImages[0] || '');
          }

          if (Object.prototype.hasOwnProperty.call(localVars, varExpr)) return localVars[varExpr];

          const dm2 = varExpr.match(/^default_images\[(\d+)\]$/);
          if (dm2) return defaultImages[parseInt(dm2[1], 10)] || '';

          if (varExpr === 'image_src') {
            const fallback = blockDefaults.image || blockDefaults.bg_image || defaultImages[index % defaultImages.length] || '';
            return fallback;
          }

          // ✅ NEW: Support forloop.index dans les variables (pour hotspot tooltips + classes dynamiques)
          if (varExpr === 'forloop.index') return String(ctx.forloop.index);
          if (varExpr === 'forloop.index0') return String(ctx.forloop.index0);

          if (varExpr.startsWith('block.') || varExpr.startsWith('section.') || varExpr.startsWith('forloop.')) {
            const val = getValueFromPath(varExpr, ctx);
            return (val !== undefined && val !== null) ? String(val) : '';
          }

          return '';
        });

        blocksHtml += current;
      });

      html = html.replace(fullMatch, blocksHtml);
    }

    // ✅ Remplacer hero_initial globalement à partir des arrays du fichier .liquid
    const heroFirst = (defaultAfterImages[0] || defaultBeforeImages[0] || '');
    if (heroFirst) {
      html = html.replace(/\{\{\s*hero_initial\s*\}\}/g, heroFirst);
    }

    // 4) If/Else HORS boucle — NEW: fournir section.blocks.size pour évaluer "section.blocks.size > 0"
    const blocksCount = (blocks && blocks.length) ? blocks.length : (presetCount || 0);
    html = resolveIfChains(html, { section: { settings, blocks: { size: blocksCount } } }, {});

    // 5) Variables globales restantes
    html = html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, expr) => {
      const varExpr = expr.split('|')[0].trim();

      const dm = varExpr.match(/^default_images\[(\d+)\]$/);
      if (dm) return defaultImages[parseInt(dm[1], 10)] || '';

      const v = getValueFromPath(varExpr, { section: { settings } });
      return (v !== undefined && v !== null) ? String(v) : '';
    });

    // 6) Nettoyage final
    html = html.replace(/\{%[\s\S]*?%\}/g, '');

    return html;
  };

  useEffect(() => {
    if (isOpen && section && iframeRef.current && activeTab === 'preview') {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;

      // Convertir le Liquid en HTML
      const processedHtml = liquidToHtml(section.liquidCode);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              html, body { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
              *, *::before, *::after { box-sizing: inherit; }
              img, video, canvas { max-width: 100% !important; }
              .hotspot-image { max-width: 100% !important; height: auto !important; }
              .accordion-section .item { height: 100% !important; }
              .accordion-section .item img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block; }
             
             /* ✅ Hotspots: activer les interactions */
             .hotspot-section { position: relative !important; width: 100% !important; overflow: visible !important; }
             .hotspot-section .wrapper { position: relative !important; display: inline-block !important; width: 100% !important; max-width: 100% !important; }
             .hotspot-section .hotspot-image { width: 100% !important; max-height: 70vh !important; object-fit: contain !important; display: block !important; margin: 0 auto !important; }
             .hotspot-section .hotspots { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; pointer-events: auto !important; }
             .hotspot-section .hotspot-item { position: absolute !important; transform: translate(-50%, -50%) !important; z-index: 1 !important; pointer-events: auto !important; }
             .hotspot-section .hotspot { width: 32px !important; height: 32px !important; border: 3px solid #fff !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; transition: transform .2s ease-out !important; position: relative !important; box-shadow: 0 2px 8px rgba(0,0,0,0.25)!important; }
             .hotspot-section .hotspot span { width: 10px !important; height: 10px !important; border-radius: 50% !important; display: block !important; }
             .hotspot-section .tooltip { position: absolute !important; bottom: 150% !important; left: 50% !important; transform: translateX(-50%) !important; padding: 12px !important; border-radius: 6px !important; opacity: 0 !important; pointer-events: none !important; transition: opacity .25s ease !important; min-width: 180px !important; max-width: 240px !important; box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important; z-index: 10000 !important; white-space: normal !important; background: #fff !important; }
             .hotspot-section .hotspot-item:hover .tooltip,
             .hotspot-section .hotspot-item.active .tooltip { opacity: 1 !important; pointer-events: auto !important; }
            </style>
          </head>
          <body>
            ${processedHtml}
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // ✅ Positions + tooltips: associer par classe .hotspot-N au lieu de l'index
      setTimeout(() => {
        try {
          const isHotspot = /hotspot-section/.test(processedHtml);

          // 🔄 Toujours parser le schema
            const { blocks } = parseSchema(section.liquidCode);

          if (!isHotspot) {
            // ===== Comportement existant (autres sections) =====
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = processedHtml;

            const cssPositionsByNum = {};
            const styleMatch = processedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
            if (styleMatch) {
              const cssText = styleMatch[1];
              const classBlockRe = /\.hotspot-(\d+)\s*\{([^}]+)\}/g;
              let m;
              while ((m = classBlockRe.exec(cssText)) !== null) {
                const num = parseInt(m[1], 10);
                const rules = m[2];
                const topMatch = rules.match(/top:\s*([^;]+);?/);
                const leftMatch = rules.match(/left:\s*([^;]+);?/);
                if (topMatch && leftMatch) {
                  cssPositionsByNum[num] = { top: topMatch[1].trim(), left: leftMatch[1].trim() };
                }
              }
            }

            const sourceItems = Array.from(tempDiv.querySelectorAll('.hotspot-item'));
            const sourceHotspots = sourceItems.map((item) => {
              const classAttr = item.getAttribute('class') || '';
              const numMatch = classAttr.match(/hotspot-(\d+)/);
              const num = numMatch ? parseInt(numMatch[1], 10) : null;
              const inline = item.getAttribute('style') || '';
              const inlineLeft = (inline.match(/left:\s*([^;]+)/) || [])[1];
              const inlineTop = (inline.match(/top:\s*([^;]+)/) || [])[1];
              const pos = {
                left: inlineLeft?.trim() || (num && cssPositionsByNum[num]?.left) || '50%',
                top: inlineTop?.trim() || (num && cssPositionsByNum[num]?.top) || '50%',
              };
              const tooltip = item.querySelector('.tooltip');
              const tooltipContent = tooltip ? tooltip.innerHTML : '';
              return { num, pos, tooltipContent };
            });

            const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            const iframeItems = Array.from(iframeDoc.querySelectorAll('.hotspot-item'));
            iframeItems.forEach((item, idx) => {
              const classAttr = item.getAttribute('class') || '';
              const numMatch = classAttr.match(/hotspot-(\d+)/);
              const num = numMatch ? parseInt(numMatch[1], 10) : null;
              let data = null;
              if (num) data = sourceHotspots.find(h => h.num === num) || null;
              if (!data) data = sourceHotspots[idx] || { pos: { left: '50%', top: '50%' }, tooltipContent: '' };

              item.style.setProperty('position', 'absolute', 'important');
              item.style.setProperty('left', data.pos.left, 'important');
              item.style.setProperty('top', data.pos.top, 'important');
              item.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
              item.style.setProperty('z-index', '10', 'important');
              item.style.removeProperty('opacity');

              const tooltip = item.querySelector('.tooltip');
              if (tooltip && !tooltip.dataset.enriched) {
                const b = blocks[(num ? num - 1 : idx)] || {};
                const title = b.hotspot_title || b.title || b.custom_title || '';
                const description = b.hotspot_description || b.description || b.custom_desc || '';
                if (title || description) {
                  let html = '';
                  if (title) html += `<div style="font-weight:600;margin-bottom:6px;font-size:14px;">${title}</div>`;
                  if (description) html += `<div style="font-size:13px;line-height:1.45;color:rgba(0,0,0,.7);">${description}</div>`;
                  tooltip.innerHTML = html;
                  tooltip.dataset.enriched = '1';
                }
              }
            });

            const hotspotsContainer = iframeDoc.querySelector('.hotspots');
            if (hotspotsContainer) {
              hotspotsContainer.style.setProperty('position', 'absolute', 'important');
              hotspotsContainer.style.setProperty('top', '0', 'important');
              hotspotsContainer.style.setProperty('left', '0', 'important');
              hotspotsContainer.style.setProperty('width', '100%', 'important');
              hotspotsContainer.style.setProperty('height', '100%', 'important');
              hotspotsContainer.style.setProperty('pointer-events', 'auto', 'important');
            }
          } else {
            // ===== MODE HOTSPOT SIMPLIFIÉ =====
            const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
            const iframeItems = Array.from(iframeDoc.querySelectorAll('.hotspot-item'));
            iframeItems.forEach((item, idx) => {
              // Ne pas écraser les positions inline générées
              item.style.setProperty('position', 'absolute', 'important');
              item.style.setProperty('transform', 'translate(-50%,-50%)', 'important');
              item.style.setProperty('z-index', '10', 'important');

              const tooltip = item.querySelector('.tooltip');
              if (tooltip && !tooltip.dataset.enriched) {
                const b = blocks[idx] || {};
                const title = b.hotspot_title || b.title || b.custom_title || '';
                const description = b.hotspot_description || b.description || b.custom_desc || '';
                if (title || description) {
                  let html = '';
                  if (title) html += `<div style="font-weight:600;margin-bottom:6px;font-size:14px;">${title}</div>`;
                  if (description) html += `<div style="font-size:13px;line-height:1.45;color:rgba(0,0,0,.7);">${description}</div>`;
                  tooltip.innerHTML = html;
                  tooltip.dataset.enriched = '1';
                }
              }
            });
            const hotspotsContainer = iframeDoc.querySelector('.hotspots');
            if (hotspotsContainer) {
              hotspotsContainer.style.setProperty('pointer-events', 'auto', 'important');
            }
          }

          console.log('✅ Hotspots mis à jour (mode hotspot:', isHotspot, ')');
        } catch (err) {
          console.error('Erreur hotspots:', err);
        }
      }, 150);

      // Auto-ajuster la hauteur de l'iframe à son contenu (limité)
      setTimeout(() => {
        try {
          const h = Math.max(iframeDoc.body.scrollHeight, 500);
          iframeRef.current.style.height = Math.min(h, 900) + 'px';
        } catch {}
      }, 50);

      // ✅ Fix rendu product-grid: forcer BEFORE pour vignettes et AFTER pour héros dans la modale
    }
  }, [isOpen, section, activeTab]);

  if (!section) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(section.liquidCode)
      .then(() => setShowToast(true))
      .catch(() => alert("Impossible de copier le code"));
  };

  return (
    <>
      <Modal
        large
        open={isOpen}
        onClose={onClose}
        title={`Démonstration - ${section.name}`}
        primaryAction={{ content: "Fermer", onAction: onClose }}
        secondaryActions={[
          { content: "Copier le code", onAction: copyCode }
        ]}
      >
        <Modal.Section>
          <style>{`
            /* ⇱ élargir la modale Polaris */
            .Polaris-Modal-Dialog__Modal {
              width: 90vw !important;
              max-width: 1200px !important; /* ajuste à ton besoin */
            }
            @media (max-width: 768px) {
              .Polaris-Modal-Dialog__Modal { width: 96vw !important; max-width: 96vw !important; }
            }

            .demo-tabs {
              display: flex;
              gap: 8px;
              margin-bottom: 16px;
              border-bottom: 2px solid #e1e3e5;
            }
            .demo-tab {
              padding: 12px 24px;
              background: none;
              border: none;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              color: #6b7280;
              border-bottom: 2px solid transparent;
              margin-bottom: -2px;
              transition: all 0.2s;
            }
            .demo-tab:hover {
              color: #111827;
            }
            .demo-tab.active {
              color: #2563eb;
              border-bottom-color: #2563eb;
            }
            .preview-container {
              border: 2px solid #e1e3e5;
              border-radius: 8px;
              background: white;
              overflow: hidden;
              min-height: 500px;
            }
            .preview-iframe {
              width: 100%;
              height: 500px;
              border: none;
              display: block;
            }
            .code-container {
              background: #1e293b;
              padding: 16px;
              border-radius: 8px;
              max-height: 500px;
              overflow: auto;
            }
            .code-content {
              color: #e2e8f0;
              font-family: 'Monaco', 'Courier New', monospace;
              font-size: 13px;
              line-height: 1.6;
              white-space: pre-wrap;
              word-break: break-word;
            }
            .info-badge {
              display: inline-block;
              padding: 4px 12px;
              background: #dbeafe;
              color: #1e40af;
              border-radius: 12px;
              font-size: 12px;
              margin-bottom: 12px;
            }
          `}</style>

          <div className="info-badge">
            📁 Catégorie: {section.category} • 💾 Fichier: {section.fileName}
          </div>

          <div className="demo-tabs">
            <button 
              className={`demo-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              👁️ Aperçu en temps réel
            </button>
            <button 
              className={`demo-tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              💻 Code source
            </button>
          </div>

          {activeTab === 'preview' ? (
            <div className="preview-container">
              <iframe 
                ref={iframeRef}
                className="preview-iframe"
                title={`Preview ${section.name}`}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <div className="code-container">
              <div className="code-content">
                {section.liquidCode}
              </div>
            </div>
          )}

        </Modal.Section>
      </Modal>

      {showToast && (
        <Toast content="Code copié !" onDismiss={() => setShowToast(false)} duration={2000} />
      )}
    </>
  );
}

// 🎨 SlideCart amélioré
function SlideCart({ cart, onClose, removeFromCart }) {
  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 380, height: "100vh", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.2)", zIndex: 1000, padding: 24, display: "flex", flexDirection: "column", borderLeft: "2px solid #f2f2f2", animation: "slideIn 0.3s ease-out" }} onClick={e => e.stopPropagation()}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%);}
          to { transform: translateX(0);}
        }
      `}</style>

      <Button plain onClick={onClose} style={{ alignSelf: "flex-end", marginBottom: 16 }}>✕</Button>

      <Text variant="headingXl" as="h2" fontWeight="bold" style={{ marginBottom: 16 }}>🛒 Votre panier</Text>

      {cart.length === 0 ? (
        <Text color="subdued">Votre panier est vide.</Text>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
          {cart.map(item => (
            <Card key={item.id} sectioned>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <Text variant="headingMd">{item.name}</Text>
                  <Text color="subdued">{item.price} €</Text>
                </div>
                <Button destructive onClick={() => removeFromCart(item.id)}>Retirer</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <Button fullWidth primary onClick={() => alert("Paiement à venir 💳")} style={{ marginTop: 16 }}>
          Procéder au paiement
        </Button>
      )}
    </div>
  );
}

// 🌈 Catégories en carrousel
function CategoryCarousel({ categories, navigate }) {
  const carouselRef = useRef(null);
  const scroll = (dir) => {
    carouselRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const routes = {
    bannieres: "/app/bannieres",
    sliders: "/app/sliders",
    "before-after": "/app/before-after",
    comparatifs: "/app/comparatifs",
  };

  return (
    <div style={{ position: "relative", marginBottom: 40 }}>
      <Button plain onClick={() => scroll(-1)} style={{ position: "absolute", left: 0, top: "40%", zIndex: 10 }}>◀</Button>
      <div ref={carouselRef} style={{ display: "flex", overflowX: "auto", gap: 24, padding: "1rem 2rem", scrollBehavior: "smooth" }}>
        {categories.map(cat => (
          <div
            key={cat.slug}
            onClick={() => navigate(routes[cat.slug])}
            style={{ flex: "0 0 140px", cursor: "pointer", textAlign: "center", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "#fff", padding: "1rem", transition: "transform 0.2s ease" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img src={cat.image} alt={cat.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }} />
            <Text variant="bodyMd">{cat.name}</Text>
          </div>
        ))}
      </div>
      <Button plain onClick={() => scroll(1)} style={{ position: "absolute", right: 0, top: "40%", zIndex: 10 }}>▶</Button>
    </div>
  );
}

// Loader OPTIMISÉ avec collecte des catégories dynamiques
export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);

  // Vérifier le cache d'abord
  const now = Date.now();
  if (sectionsCache && categoriesCache && now - cacheTime < CACHE_DURATION) {
    console.log('📋 Données depuis le cache:', { sections: sectionsCache.length, categories: categoriesCache.length });
    return { sections: sectionsCache, categories: categoriesCache };
  }

  const fs = await import("fs/promises");
  const path = await import("path");

  // ⚠️ CORRECTION DU CHEMIN - plusieurs tentatives
  const possiblePaths = [
    path.join(process.cwd(), "sections"),
    path.join(process.cwd(), "app", "sections"), 
    path.join(process.cwd(), "..", "sections"),
    "/sgoinfre/goinfre/Perso/ayael-ou/app_addict/section-addict/app/sections"
  ];

  let sectionsDir = null;
  
  // Tester chaque chemin possible
  for (const testPath of possiblePaths) {
    try {
      await fs.access(testPath);
      sectionsDir = testPath;
      console.log(`✅ Dossier sections trouvé à: ${sectionsDir}`);
      break;
    } catch (error) {
      console.log(`❌ Chemin testé non trouvé: ${testPath}`);
    }
  }

  const sectionItems = [];
  const foundCategories = new Set();

  if (!sectionsDir) {
    console.error("🚨 AUCUN dossier sections trouvé dans les chemins testés");
    return { sections: [], categories: [] };
  }

  try {
    const readSections = async (dir, category = "") => {
      try {
        console.log(`📂 Lecture du dossier: ${dir} (catégorie: ${category})`);
        const items = await fs.readdir(dir);
        console.log(`📄 Éléments trouvés:`, items);

        await Promise.all(items.map(async (item) => {
          try {
            const fullPath = path.join(dir, item);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
              // C'est un dossier = nouvelle catégorie
              console.log(`📁 Dossier de catégorie trouvé: ${item}`);
              foundCategories.add(item);
              await readSections(fullPath, item);
            } else if (item.endsWith('.liquid')) {
              // C'est un fichier Liquid
              console.log(`💧 Fichier Liquid trouvé: ${item} dans catégorie: ${category}`);
              const content = await fs.readFile(fullPath, 'utf8');
              const section = parseLiquidSection(content, item, category, fullPath);
              if (section) {
                sectionItems.push(section);
                if (category) {
                  foundCategories.add(category);
                }
              }
            }
          } catch (err) {
            console.error(`Erreur lors de sla lecture de l'élément ${item} dans ${dir}:`, err);
          }
        }));
      } catch (err) {
        console.error(`Erreur lors de la lecture du dossier ${dir}:`, err);
      }
    };

    await readSections(sectionsDir);
  } catch (error) {
    console.error("Erreur lors de la lecture des sections:", error);
  }

  // Trier les sections par nom
  sectionItems.sort((a, b) => a.name.localeCompare(b.name));

  // Mettre à jour le cache
  sectionsCache = sectionItems;
  categoriesCache = Array.from(foundCategories);
  cacheTime = Date.now();

  console.log('✅ Sections et catégories chargées:', { sections: sectionItems.length, categories: categoriesCache.length });

  return { sections: sectionItems, categories: categoriesCache };
};

// Fonction d'analyse des sections Liquid
function parseLiquidSection(content, fileName, category, filePath) {
  try {
    // Extraire le schema JSON si présent
    const schemaMatch = content.match(/{% schema %}([\s\S]*?){% endschema %}/);
    let schema = {};

    if (schemaMatch) {
      try {
        schema = JSON.parse(schemaMatch[1]);
      } catch (e) {
        console.error(`Erreur parsing schema pour ${fileName}:`, e);
      }
    }

    // Extraction du nom de la section (avant le tiret bas)
    const nameMatch = fileName.match(/^(.+?)(?:[_-]|$)/);
    const name = nameMatch ? nameMatch[1] : fileName.replace('.liquid', '');

    // Génération d'un aperçu basé sur le code Liquid et la catégorie
    const previewHtml = generatePreviewFromLiquid(content, schema, category);

    return {
      id: fileName.replace('.liquid', ''),
      name: schema.name || name.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      fileName: fileName,
      category: category,
      description: schema.description || `Section ${category}`,
      price: 15,
      // Ici on modifie le chemin de l'image pour utiliser "public/images/sections/${nomDuFichier}.jpg"
      image: `/images/sections/${fileName.replace('.liquid', '')}.jpg`,
      filePath: filePath,
      liquidCode: content,
      previewHtml: previewHtml,
    };
  } catch (error) {
    console.error(`Erreur parsing section ${fileName}:`, error);
    return null;
  }
}

// Fonction pour générer un aperçu à partir du code Liquid
function generatePreviewFromLiquid(liquidCode, schema, category) {
  // Aperçus spécialisés pour vos catégories détectées
  
  if (category === 'templates' || category === 'scroll-text') {
    return `<div style="background: #FFDD00; padding: 20px; overflow: hidden; border-radius: 8px;">
      <div style="display: flex; animation: scroll 10s linear infinite; white-space: nowrap;">
        <span style="padding-right: 50px; font-size: 24px; font-weight: bold; color: #000;">🎉 ${schema.name || 'Texte défilant coloré'} 🎉</span>
        <span style="padding-right: 50px; font-size: 24px; font-weight: bold, color: #000;">🎉 ${schema.name || 'Texte défilant coloré'} 🎉</span>
      </div>
      <style>@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); }}</style>
    </div>`;
  }

  if (category === 'collection') {
    return `<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
      <h3 style="color: white; text-align: center; margin-bottom: 20px;">Accordéon Collections</h3>
      <div style="display: flex; gap: 10px; height: 150px;">
        ${[1,2,3,4].map(i => `
          <div style="flex: 1; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: flex 0.3s;">
            Collection ${i}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  if (category === 'faq') {
    return `<div style="padding: 20px; max-width: 600px; margin: 0 auto; background: #f3ecfd; border-radius: 8px;">
      <h2 style="text-align: center; margin-bottom: 30px; color: #111;">FAQ Moderne</h2>
      ${[1,2,3].map(i => `
        <details style="border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px; background: white;">
          <summary style="padding: 16px; cursor: pointer; font-weight: 600;">❓ Question ${i}</summary>
          <div style="padding: 0 16px 16px; color: #666;">Réponse à la question ${i}.</div>
        </details>
      `).join('')}
    </div>`;
  }

  if (category === 'banner') {
    return `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; border-radius: 8px; position: relative; overflow: hidden;">
      <h1 style="margin-bottom: 16px; font-size: 32px;">🎬 Studio Banner</h1>
      <p style="margin-bottom: 24px; opacity: 0.9;">Bannière scrollable avec média</p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
        <div style="width: 200px; height: 120px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">📸 Média</div>
      </div>
    </div>`;
  }

  if (category === 'product-grid') {
    return `<div style="padding: 20px; background: white; border-radius: 8px;">
      <h2 style="text-align: center; margin-bottom: 30px; color: #BF0603;">Nouveautés + Best-sellers</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
        ${[1,2].map(i => `
          <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; position: relative;">
            <div style="position: absolute; top: -8px; left: 8px; background: #000; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Best-seller</div>
            <div style="background: #f0f0f0; height: 120px; margin-bottom: 10px; border-radius: 4px;"></div>
            <h4>Produit ${i}</h4>
            <p style="color: #BF0603; font-weight: bold;">€${i*15}.99</p>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  if (category === 'promo-banner') {
    return `<div style="background: #000; color: #FFD700; padding: 40px 20px; text-align: center; border-radius: 8px; position: relative; overflow: hidden;">
      <div style="font-size: 48px; font-weight: bold, animation: flash 1s infinite alternate;">BLACK FRIDAY</div>
      <div style="font-size: 24px; margin-top: 10px;">70% OFF</div>
      <div style="position: absolute; top: 10px; right: 10px; background: #FFD700; color: #000; padding: 5px 10px; border-radius: 4px; font-weight: bold;">SALE</div>
      <style>@keyframes flash { 0% { opacity: 1; } 100% { opacity: 0.7; }}</style>
    </div>`;
  }

  if (category === 'slider-video') {
    return `<div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <h3 style="text-align: center; margin-bottom: 20px;">Videos Slider</h3>
      <div style="display: flex; gap: 15px; overflow: hidden;">
        ${[1,2,3,4].map(i => `
          <div style="flex: 0 0 200px; height: 150px; background: #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="font-size: 48px;">▶️</div>
            <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">Video ${i}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  if (category === 'social') {
    return `<div style="padding: 40px 20px; background: white; text-align: center; border-radius: 8px;">
      <h3 style="margin-bottom: 30px;">Social Buttons</h3>
      <div style="display: flex; justify-content: center, gap: 15px;">
        ${['📘', '🐦', '📷', '💼', '📺'].map(icon => `
          <div style="width: 60px; height: 60px; background: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ${icon}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  if (category === 'us-them') {
    return `<div style="padding: 30px; background: #e7f0fd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background: #000; color: white; padding: 5px 15px; border-radius: 5px; display: inline-block; margin-bottom: 10px;">us vs. them</div>
        <h2 style="margin-bottom: 15px;">Coffee upgrade like no other</h2>
      </div>
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
        <div style="flex: 1; text-align: center;">
          <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #277bed, #000); border-radius: 8px; margin: 0 auto;"></div>
          <div style="margin-top: 10px; font-weight: bold;">Notre produit</div>
        </div>
        <div style="width: 40px; height: 40px; background: #000; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">VS</div>
        <div style="flex: 1; text-align: center;">
          <div style="width: 100px; height: 100px; background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; margin: 0 auto;"></div>
          <div style="margin-top: 10px; color: #666;">Concurrent</div>
        </div>
      </div>
      <div style="background: #000; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-top: 20px;">
        <button style="background: #2e59ac; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">TRY NOW</button>
      </div>
    </div>`;
  }

  // Aperçu générique si aucune catégorie spécifique
  return `<div style="padding: 20px; text-align: center; border: 2px dashed #ddd; border-radius: 8px; background: #f9f9f9;">
    <h3 style="color: #666; margin-bottom: 10px;">${schema.name || `Section ${category}`}</h3>
    <p style="color: #999;">Catégorie: <strong>${category || 'Non définie'}</strong></p>
    <p style="color: #999;">Aperçu de la section Liquid</p>
  </div>`;
}

// Composant principal
export default function Index() {
  const navigate = useNavigate();
  const { sections = [], categories: availableCategories = [] } = useLoaderData();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    setCart(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (section) => {
    if (!cart.find((i) => i.id === section.id)) setCart([...cart, section]);
  };

  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  // Filtrage des sections par recherche + catégories
  const filteredSections = sections.filter(section => {
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(section.category);
    return matchesSearch && matchesCategory;
  });

  const handleDemo = (section) => {
    setSelectedDemo(section);
    setShowDemo(true);
  };

  return (
    <Page fullWidth>
      <TitleBar title="Section Addict" />

      {/* Header panier */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onClick={() => setShowCart(true)}>
          Panier <Badge status="info">{cart.length}</Badge>
        </Button>
      </div>

      {showCart && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 999 }}
          onClick={() => setShowCart(false)}
        >
          <SlideCart cart={cart} onClose={() => setShowCart(false)} removeFromCart={removeFromCart} />
        </div>
      )}

      {/* Bannière accueil */}
      <Card sectioned>
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #ec4899)", color: "#fff", borderRadius: 16, padding: "4rem 2rem", textAlign: "center" }}>
          <Text variant="heading2xl" as="h1" fontWeight="bold" style={{ marginBottom: 16 }}>
            Créez une boutique Shopify unique
          </Text>
          <p style={{ fontSize: 18, marginBottom: 24 }}>
            Découvrez des sections prêtes à l'emploi pour booster votre design : bannières, sliders, comparatifs et plus encore.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Button primary size="large" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>
              Explorer le catalogue
            </Button>
          </div>
        </div>
      </Card>

      {/* Catégories */}
      <Text variant="headingXl" as="h2" fontWeight="bold" style={{ margin: "40px 0 16px", textAlign: "center" }}>
        Catégories populaires
      </Text>
      <CategoryCarousel categories={categories} navigate={navigate} />

      {/* Informations sur les catégories trouvées */}
      {availableCategories.length > 0 && (
        <Card sectioned>
          <Text variant="headingMd" style={{ marginBottom: 8 }}>
            📁 Catégories détectées ({availableCategories.length})
          </Text>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {availableCategories.map(category => (
              <Badge key={category} status="info">{category}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Barre de recherche et filtres avec catégories dynamiques */}
      <SearchAndFilters 
        onSearch={setSearchTerm} 
        onFilter={setSelectedCategories} 
        selectedCategories={selectedCategories}
        availableCategories={availableCategories}
      />

      {/* Catalogue */}
      <div id="catalog" style={{ marginTop: 48 }}>
        <Text variant="headingXl" as="h2" fontWeight="bold" style={{ marginBottom: 24, textAlign: "center" }}>
          Catalogue des sections ({filteredSections.length})
        </Text>

        {sections.length === 0 ? (
          <Card sectioned>
            <div style={{ textAlign: "center", padding: 40 }}>
              <Text variant="headingMd" color="subdued">
                Aucune section trouvée dans le dossier sections/
              </Text>
              <Text color="subdued" style={{ marginTop: 8 }}>
                Créez des fichiers .liquid dans des sous-dossiers de sections/ pour les voir apparaître ici.
              </Text>
            </div>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {filteredSections.map(section => (
              <Card key={section.id} sectioned>
                <div style={{ textAlign: "center" }}>
                  <img
                    src={section.image}
                    alt={section.name}
                    style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, marginBottom: 12 }}
                    onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ESection%3C/text%3E"; }}
                  />
                  <Badge status="info" size="small" style={{ marginBottom: 8 }}>{section.category}</Badge>
                  <Text variant="headingMd">{section.name}</Text>
                  <Text color="subdued">{section.description}</Text>
                  <Text style={{ fontWeight: "bold", margin: "8px 0" }}>{section.price} €</Text>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Button onClick={() => addToCart(section)} fullWidth>Ajouter au panier</Button>
                    <Button outline onClick={() => handleDemo(section)} fullWidth>Démo</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredSections.length === 0 && sections.length > 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text variant="headingMd" color="subdued">Aucune section ne correspond à vos critères de recherche</Text>
          </div>
        )}
      </div>

      {/* Modal de démonstration */}
      <DemoModal section={selectedDemo} isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </Page>
  );
}