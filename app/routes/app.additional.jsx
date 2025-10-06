<<<<<<< HEAD
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  return (
    <Page>
      <TitleBar title="Additional page" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which
                demonstrates how to create multiple pages within app navigation
                using{" "}
                <Link
                  url="https://shopify.dev/docs/apps/tools/app-bridge"
                  target="_blank"
                  removeUnderline
                >
                  App Bridge
                </Link>
                .
              </Text>
              <Text as="p" variant="bodyMd">
                To create your own page and have it show up in the app
                navigation, add a page inside <Code>app/routes</Code>, and a
                link to it in the <Code>&lt;NavMenu&gt;</Code> component found
                in <Code>app/routes/app.jsx</Code>.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              <List>
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                    target="_blank"
                    removeUnderline
                  >
                    App nav best practices
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
=======
export default function AdditionalPage() {
  return (
    <s-page>
      <ui-title-bar title="Additional page"></ui-title-bar>
      <s-section heading="Multiple pages">
        <s-paragraph>
          The app template comes with an additional page which demonstrates how
          to create multiple pages within app navigation using{" "}
          <s-link
            href="https://shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
          >
            App Bridge
          </s-link>
          .
        </s-paragraph>
        <s-paragraph>
          To create your own page and have it show up in the app navigation, add
          a page inside <code>app/routes</code>, and a link to it in the{" "}
          <code>&lt;ui-nav-menu&gt;</code> component found in{" "}
          <code>app/routes/app.jsx</code>.
        </s-paragraph>
      </s-section>
      <s-section slot="aside" heading="Resources">
        <s-unordered-list>
          <s-list-item>
            <s-link
              href="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
              target="_blank"
            >
              App nav best practices
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
>>>>>>> 9e37be4 (push)
  );
}
