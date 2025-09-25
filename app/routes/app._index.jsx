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