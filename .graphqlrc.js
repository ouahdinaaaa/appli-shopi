import fs from "fs";
<<<<<<< HEAD
import { ApiVersion } from "@shopify/shopify-api";
import { shopifyApiProject, ApiType } from "@shopify/api-codegen-preset";
=======
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApiProject, ApiType } from "@shopify/api-codegen-preset";

>>>>>>> 9e37be4 (push)
function getConfig() {
  const config = {
    projects: {
      default: shopifyApiProject({
        apiType: ApiType.Admin,
<<<<<<< HEAD
        apiVersion: ApiVersion.July25,
=======
        apiVersion: LATEST_API_VERSION,
>>>>>>> 9e37be4 (push)
        documents: [
          "./app/**/*.{js,ts,jsx,tsx}",
          "./app/.server/**/*.{js,ts,jsx,tsx}",
        ],
        outputDir: "./app/types",
      }),
    },
  };
  let extensions = [];
<<<<<<< HEAD
=======

>>>>>>> 9e37be4 (push)
  try {
    extensions = fs.readdirSync("./extensions");
  } catch {
    // ignore if no extensions
  }
<<<<<<< HEAD
  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`;
    const schema = `${extensionPath}/schema.graphql`;
    if (!fs.existsSync(schema)) {
      continue;
    }
=======

  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`;
    const schema = `${extensionPath}/schema.graphql`;

    if (!fs.existsSync(schema)) {
      continue;
    }

>>>>>>> 9e37be4 (push)
    config.projects[entry] = {
      schema,
      documents: [`${extensionPath}/**/*.graphql`],
    };
  }
<<<<<<< HEAD
  return config;
}
const config = getConfig();
=======

  return config;
}

const config = getConfig();

>>>>>>> 9e37be4 (push)
export default config;
