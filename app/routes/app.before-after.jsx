import { Page, Card, Text, Button } from "@shopify/polaris";
import { useNavigate } from "react-router";

const sections = [
  {
    id: "before-after1",
    name: "Comparaison Image",
    description: "Slider avant/après interactif",
    price: 18,
    image: "/images/beforeafter1.jpg",
    filename: "image-comparison.liquid"
  },
  {
    id: "before-after2",
    name: "Transformation Produit", 
    description: "Montrez l'efficacité de vos produits",
    price: 16,
    image: "/images/beforeafter2.jpg",
    filename: "product-transformation.liquid"
  },
  {
    id: "before-after3",
    name: "Résultats Clients",
    description: "Témoignages visuels de transformations",
    price: 14,
    image: "/images/beforeafter3.jpg",
    filename: "client-results.liquid"
  }
];

export default function BeforeAfterPage() {
  const navigate = useNavigate();

  return (
    <Page>
      {/* En-tête */}
      <Card sectioned>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 16,
            background: "linear-gradient(135deg, #f093fb, #f5576c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px"
          }}>
            ⚖️
          </div>
          <div>
            <Text variant="heading2xl" as="h1" fontWeight="bold">
              Before/After
            </Text>
            <Text color="subdued" style={{ marginTop: 8 }}>
              Montrez des transformations impressionnantes avec des comparaisons avant/après.
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
        <Button onClick={() => navigate("/app")} size="large">
          ← Retour à l'accueil
        </Button>
      </div>
    </Page>
  );
}