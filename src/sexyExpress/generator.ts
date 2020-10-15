import fetch from "node-fetch";
import { command } from "execa";
import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import JSONTOYAML from "json-to-pretty-yaml";

import store from "./store";
import { Config } from "./index";
import { me } from "../controllers/user";

export async function generateDocs() {
  let jsonOpenApiPath = "";
  if (!process.env.DOC_MODE) {
    return;
  }

  console.log(
    "\nProject started in DOC_MODE. Documentation will now generate 📑\nProcess will kill itself at the end.\n",
  );

  setTimeout(async () => {
    // generate tmp folder
    const tmpPath = `${process.cwd()}/docs`;

    const openApiDoc = _initOpenApiDoc();

    await fs.ensureDir(tmpPath);

    const routes = store.get("routes") as { path: string; method: string }[];

    for (const route of routes) {
      // TODO add support for params and body
      const res = await fetch(`http://localhost:8000${route.path}`, {
        method: route.method,
        body: ["PUT", "POST"].includes(route.method)
          ? JSON.stringify({})
          : undefined,
      }).then((r) => r.json());

      let formatedTypeName = "";
      const params: string[] = [];

      if (route.path === "/") {
        formatedTypeName = "Home";
      } else {
        formatedTypeName = route.path
          .split("/")
          .map((word) => {
            word.length ? word[0].toUpperCase() + word.substring(1) : "";

            if (word.length) {
              let wordFormated = word;
              if (word.includes(":")) {
                wordFormated = wordFormated.replace(":", "");
                params.push(wordFormated);
              }

              return wordFormated[0].toUpperCase() + wordFormated.substring(1);
            } else {
              return "";
            }
          })
          .join("");
      }

      try {
        const jsonFilePath = `${tmpPath}/tmp.json`;

        await fs.writeJSON(jsonFilePath, res);

        const typeName = `${route.method[0] +
          route.method.substring(1).toLowerCase()}${formatedTypeName}Response`;

        const cm1 = await command(
          `node ${process.cwd()}/node_modules/quicktype/dist/cli/index.js ${jsonFilePath} -l typescript --just-types -t ${typeName}`,
        );

        const typeFile = `${tmpPath}/tmp.ts`;
        await fs.writeFile(typeFile, cm1.stdout);

        // TODO use node path

        const { stdout } = await command(
          `ts-to-openapi -f ${typeFile} -t ${typeName}`,
        );

        let fixed = stdout.replace("/**", "");
        fixed = fixed.replace("*/", "");
        fixed = fixed.replace(/ \* /g, "");
        fixed = fixed.replace("@swagger", "---");

        const doc = yaml.safeLoad(fixed) as any;

        const keys = Object.keys(doc.components.schemas);
        // @ts-ignore

        keys.forEach((key) => {
          // @ts-ignore
          openApiDoc.components.schemas[key] = doc.components.schemas[key];
        });

        let pathToUse = route.path;

        params.forEach((param) => {
          pathToUse = pathToUse.replace(`:${param}`, `{${param}}`);
        });

        // @ts-ignore
        if (!openApiDoc.paths[pathToUse]) {
          // @ts-ignore
          openApiDoc.paths[pathToUse] = {};
        }

        // @ts-ignore
        openApiDoc.paths[pathToUse][route.method.toLowerCase()] = {
          summary: "",
          parameters: params.map((param) => {
            return {
              name: param,
              in: "path",
              required: true,
              description: "",
              schema: {
                type: "string",
              },
            };
          }),
          description: "",
          responses: {
            "200": {
              description: "",
              content: {
                "application/json": {
                  schema: {
                    $ref: `#/components/schemas/${typeName}`,
                  },
                },
              },
            },
          },
        };

        jsonOpenApiPath = `${tmpPath}/openApiDoc.json`;
        await fs.writeJSON(jsonOpenApiPath, openApiDoc);
        await Promise.all([fs.remove(typeFile), fs.remove(jsonFilePath)]);
      } catch (e) {
        console.log(e);
      }
    }

    const yamlOpenApiPath = await generateYamlFromOpenApiJson(jsonOpenApiPath);

    await command(
      `node ${process.cwd()}/node_modules/openapi-markdown/bin/index.js -i ${yamlOpenApiPath}`,
    );

    console.log(
      "\nOpenAPI Documentation generated under /docs 📙\nJob's done - shuting down process.\n",
    );

    process.exit();
  }, 1000);
}

function _initOpenApiDoc() {
  const config = store.get("config") as Config;

  const file = {
    openapi: "3.0.0",
    info: {
      version: config.doc?.version ?? "",
      title: config.doc?.title ?? "",
      description: config.doc?.description ?? "",
    },
    paths: {},
    servers: [
      {
        url: "http://localhost:8000",
        description: "URL",
      },
    ],
    components: {
      schemas: {},
    },
  };
  return file;
}

async function generateYamlFromOpenApiJson(jsonFilePath: string) {
  const jsonData = await fs.readJSON(jsonFilePath);
  const yamlData = JSONTOYAML.stringify(jsonData);
  const yamlFile = "docs/opanApiDoc.yaml";
  await fs.outputFile(yamlFile, yamlData);
  return yamlFile;
}
