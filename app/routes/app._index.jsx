<<<<<<< HEAD
import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Select,
  Banner,
  FormLayout,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  // ÉTAT POUR L'INJECTION DE SECTIONS
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [injectionLoading, setInjectionLoading] = useState(false);
  const [injectionResult, setInjectionResult] = useState(null);

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  // Charger les sections disponibles
  useEffect(() => {
    loadAvailableSections();
  }, []);

  const loadAvailableSections = async () => {
    try {
      const response = await fetch('/api/sections/list');
      const data = await response.json();
      if (data.success) {
        setSections(data.sections);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleInjectSection = async () => {
    if (!selectedSection) return;
    
    setInjectionLoading(true);
    setInjectionResult(null);
    
    try {
      const response = await fetch('/api/sections/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionName: selectedSection
        }),
      });

      const result = await response.json();
      setInjectionResult(result);
      
      if (result.success) {
        shopify.toast.show("Section injected successfully!");
        loadAvailableSections(); // Recharger la liste
      }
    } catch (error) {
      setInjectionResult({ success: false, error: error.message });
    } finally {
      setInjectionLoading(false);
    }
  };

  return (
    <Page>
      <TitleBar title="Section Addict - Injecteur de Sections">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      
      <BlockStack gap="500">
        <Layout>
          {/* SECTION INJECTION - NOUVELLE FONCTIONNALITÉ */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  🎯 Injection de Sections
                </Text>
                <Text as="p" variant="bodyMd">
                  Injectez vos sections Liquid personnalisées directement dans votre thème Shopify.
                </Text>
                
                <FormLayout>
                  <Select
                    label="Choisissez une section à injecter"
                    options={[
                      { label: '-- Sélectionnez une section --', value: '' },
                      ...sections.map(section => ({
                        label: section.replace('.liquid', ''),
                        value: section
                      }))
                    ]}
                    onChange={setSelectedSection}
                    value={selectedSection}
                  />
                  
                  <Button 
                    primary 
                    onClick={handleInjectSection}
                    loading={injectionLoading}
                    disabled={!selectedSection}
                  >
                    🚀 Injecter la Section
                  </Button>
                </FormLayout>

                {injectionResult && (
                  <Banner 
                    status={injectionResult.success ? "success" : "critical"}
                    title={injectionResult.success ? "✅ Succès!" : "❌ Erreur"}
                  >
                    <p>{injectionResult.success ? injectionResult.message : injectionResult.error}</p>
                  </Banner>
                )}

                {sections.length > 0 && (
                  <Box padding="400" background="bg-surface-active" borderWidth="025" borderRadius="200">
                    <Text as="h3" variant="headingSm">
                      📁 Sections Disponibles ({sections.length})
                    </Text>
                    <BlockStack gap="100">
                      {sections.map((section, index) => (
                        <Text key={index} as="span" variant="bodyMd">
                          • {section.replace('.liquid', '')}
                        </Text>
                      ))}
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* CONTENU ORIGINAL DE L'APP */}
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Congrats on creating a new Shopify app 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This embedded app template uses{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/tools/app-bridge"
                      target="_blank"
                      removeUnderline
                    >
                      App Bridge
                    </Link>{" "}
                    interface examples like an{" "}
                    <Link url="/app/additional" removeUnderline>
                      additional page in the app nav
                    </Link>
                    , as well as an{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql"
                      target="_blank"
                      removeUnderline
                    >
                      Admin GraphQL
                    </Link>{" "}
                    mutation demo, to provide a starting point for app
                    development.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Get started with products
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Generate a product with GraphQL and get the JSON output for
                    that product. Learn more about the{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
                      target="_blank"
                      removeUnderline
                    >
                      productCreate
                    </Link>{" "}
                    mutation in our API references.
                  </Text>
                </BlockStack>
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateProduct}>
                    Generate a product
                  </Button>
                  {fetcher.data?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {fetcher.data?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productCreate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.product, null, 2)}
                        </code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantsBulkUpdate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.variant, null, 2)}
                        </code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  <List>
                    <List.Item>
                      Build an{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                        target="_blank"
                        removeUnderline
                      >
                        {" "}
                        example app
                      </Link>{" "}
                      to get started
                    </List.Item>
                    <List.Item>
                      Explore Shopify's API with{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                        target="_blank"
                        removeUnderline
                      >
                        GraphiQL
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
=======
import { useState, useEffect, useRef } from "react";
import { Page, Card, Text, Button, Badge } from "@shopify/polaris";
import { useNavigate } from "react-router";

// Données des catégories
const categories = [
  { name: "Bannières", slug: "bannieres", image: "/images/banner.jpg" },
  { name: "Sliders", slug: "sliders", image: "/images/slider.jpg" },
  { name: "Before/After", slug: "before-after", image: "/images/beforeafter.jpg" },
  { name: "Comparatifs", slug: "comparatifs", image: "/images/comparatif.jpg" },
];

// Données sections
const sections = [
  { id: "section1", name: "Scroll Text Color", description: "Une section moderne qui change la couleur du texte au scroll", filename: "scroll-text-color.liquid", price: 9, image: "/images/banner1.jpg" }
];

// SlideCart amélioré
function SlideCart({ cart, onClose, removeFromCart }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 360,
        height: "100vh",
        background: "#f9f9f9",
        boxShadow: "-6px 0 24px rgba(0,0,0,0.2)",
        zIndex: 1000,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        borderLeft: "2px solid #ececec",
        transition: "transform 0.3s ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Button plain onClick={onClose} style={{ alignSelf: "flex-end", marginBottom: 16 }}>
        Fermer
      </Button>

      <Text variant="headingXl" as="h2" fontWeight="bold" style={{ marginBottom: 16 }}>
        Votre panier
      </Text>

      {cart.length === 0 ? (
        <Text color="subdued">Votre panier est vide.</Text>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {cart.map((item) => (
            <Card key={item.id} sectioned>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text variant="headingMd">{item.name}</Text>
                  <Text color="subdued">{item.price} €</Text>
                </div>
                <Button destructive onClick={() => removeFromCart(item.id)}>
                  Retirer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <Button fullWidth primary onClick={() => alert("Paiement à implémenter 💳")} style={{ marginTop: 16 }}>
          Procéder au paiement
        </Button>
      )}
    </div>
  );
}

// Carrousel de catégories
function CategoryCarousel({ categories, navigate }) {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction * 280, behavior: "smooth" });
    }
  };

  // Ajout du mapping des routes ici
const categoryRoutes = {
  "bannieres": "/app/bannieres",
  "sliders": "/app/sliders",
  "before-after": "/app/before-after",
  "comparatifs": "/app/comparatifs"
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 40 }}>
      <Button plain onClick={() => scroll(-1)} style={{ position: "absolute", left: -40, zIndex: 10 }}>◀</Button>
      <div
        ref={carouselRef}
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 24,
          scrollBehavior: "smooth",
          padding: "1rem 0",
          margin: "0 40px",
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.slug}
            onClick={() => navigate(categoryRoutes[cat.slug])}
            style={{
              cursor: "pointer",
              flex: "0 0 auto",
              textAlign: "center",
              borderRadius: "50%",
              width: 120,
              height: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "2px solid #ececec",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <img
              src={cat.image}
              alt={cat.name}
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }}
            />
            <Text variant="bodyMd">{cat.name}</Text>
          </div>
        ))}
      </div>
      <Button plain onClick={() => scroll(1)} style={{ position: "absolute", right: -40, zIndex: 10 }}>▶</Button>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    setCart(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (section) => {
    if (!cart.find((item) => item.id === section.id)) setCart([...cart, section]);
  };
  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  return (
    <Page fullWidth>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onClick={() => setShowCart(true)}>
          Panier <Badge status="info">{cart.length}</Badge>
        </Button>
      </div>

      {/* Overlay panier */}
      {showCart && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
          onClick={() => setShowCart(false)}
        >
          <SlideCart cart={cart} onClose={() => setShowCart(false)} removeFromCart={removeFromCart} />
        </div>
      )}

      {/* Section accueil */}
      <Card sectioned>
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e5, #ec4899)",
            color: "#fff",
            borderRadius: 16,
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <Text variant="heading2xl" as="h1" fontWeight="bold" style={{ marginBottom: 16 }}>
            Créez une boutique Shopify unique
          </Text>
          <p style={{ fontSize: 18, marginBottom: 24 }}>
            Découvrez des sections prêtes à l'emploi pour booster votre design :
            bannières, sliders, comparatifs et plus encore.
          </p>
          <Button primary size="large" onClick={() => navigate("#catalog")}>
            Explorer le catalogue
          </Button>
        </div>
      </Card>

      {/* Carrousel catégories */}
      <Text variant="headingXl" as="h2" fontWeight="bold" style={{ margin: "40px 0 16px", textAlign: "center" }}>
        Catégories populaires
      </Text>
      <CategoryCarousel categories={categories} navigate={navigate} />

      {/* Catalogue */}
      <div id="catalog" style={{ marginTop: 48 }}>
        <Text variant="headingXl" as="h2" fontWeight="bold" style={{ marginBottom: 24, textAlign: "center" }}>
          Catalogue des sections
        </Text>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 32,
          }}
        >
          {sections.map((section) => (
            <Card key={section.id} sectioned>
              <div style={{ textAlign: "center" }}>
                <img
                  src={section.image}
                  alt={section.name}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                />
                <Text variant="headingMd" as="h3">{section.name}</Text>
                <Text color="subdued">{section.description}</Text>
                <Text style={{ fontWeight: "bold", margin: "8px 0" }}>{section.price} €</Text>
                <Button onClick={() => addToCart(section)} fullWidth>Ajouter au panier</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}

export const loader = async () => null;
>>>>>>> 9e37be4 (push)
