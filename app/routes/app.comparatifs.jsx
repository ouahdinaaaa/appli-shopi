import { Page, Card, Text, Button } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "../hooks/useGoBack";

const sections = [
  {
    id: "comparatif1",
    name: "Tableau Comparatif",
    description: "Tableau de comparaison de produits",
    price: 20,
    image: "/images/comparatif1.jpg",
    filename: "comparison-table.liquid"
  },
  {
    id: "comparatif2",
    name: "Nous vs Eux",
    description: "Section de comparaison concurrentielle",
    price: 22,
    image: "/images/comparatif2.jpg",
    filename: "us-vs-them.liquid"
  },
  {
    id: "comparatif3",
    name: "Plans & Prix",
    description: "Comparez vos offres et tarifs",
    price: 18,
    image: "/images/comparatif3.jpg",
    filename: "pricing-comparison.liquid"
  }
];

export default function ComparatifsPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <Page>
      {/* En-tête */}
      <Card sectioned>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 16,
            background: "linear-gradient(135deg, #4facfe, #00f2fe)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px"
          }}>
            📊
          </div>
          <div>
            <Text variant="heading2xl" as="h1" fontWeight="bold">
              Comparatifs
            </Text>
            <Text color="subdued" style={{ marginTop: 8 }}>
              Comparez vos offres et mettez en valeur vos avantages concurrentiels.
            </Text>
          </div>
        </div>
      </Card>

      {/* Sections */}
      <div style={{ marginTop: 32 }}>
        <Text variant="headingXl" as="h2" style={{ marginBottom: 24 }}>
          {sections.length} sections disponibles
        </Text>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {sections.map((section) => (
            <Card key={section.id} sectioned>
              <div style={{ textAlign: "center" }}>
                <img
                  src={section.image}
                  alt={section.name}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 16,
                    border: "1px solid #e1e1e1"
                  }}
                />
                <Text variant="headingMd" as="h3" style={{ marginBottom: 8 }}>
                  {section.name}
                </Text>
                <Text color="subdued" style={{ marginBottom: 12 }}>
                  {section.description}
                </Text>
                <Text style={{ 
                  fontWeight: "bold", 
                  marginBottom: 16, 
                  fontSize: "20px",
                  color: "#2563eb" 
                }}>
                  {section.price} €
                </Text>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <Button 
                    onClick={() => alert("🔍 Aperçu de " + section.name)} 
                    outline
                  >
                    Aperçu
                  </Button>
                  <Button 
                    onClick={() => alert("✅ " + section.name + " ajouté au panier !")} 
                    primary
                  >
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bouton retour */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
    <Button onClick={goBack} size="large">
      ← Retour à l’accueil
    </Button>
      </div>
    </Page>
  );
}