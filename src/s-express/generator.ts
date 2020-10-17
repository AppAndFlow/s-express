import fetch from "node-fetch";
import { command } from "execa";
import fs from "fs-extra";
import yaml from "js-yaml";
import JSONTOYAML from "json-to-pretty-yaml";

import store, { Field, getConfig, getRoutes } from "./store";
import { Config, DEFAULT_PORT } from "./index";
import { isFieldRequired } from "../utils/requiredFields";

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

    const config = getConfig();

    await fs.ensureDir(tmpPath);

    const routes = getRoutes();
    const port = config.port || DEFAULT_PORT;

    for (const route of routes) {
      const tag = _extractTag(route.path);

      const res = await fetch(`http://localhost:${port}${route.path}`, {
        method: route.method,
        headers: config.doc && config.doc.headers ? config.doc.headers : [],
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
          summary: route.summary,
          parameters: generateParameters(params, route.fields),
          description: route.description,
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

        if (tag) {
          Object.assign(
            openApiDoc.paths[pathToUse][route.method.toLowerCase()],
            tag,
          );
        }

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

  const file: any = {
    openapi: "3.0.0",
    info: {
      version: config.doc?.version ?? "",
      title: config.doc?.title ?? "",
      description: config.doc?.description ?? "",
    },
    paths: {},
    components: {
      schemas: {},
    },
  };
  if (config.doc && config.doc.servers) {
    file["servers"] = config.doc.servers;
  }

  return file;
}

async function generateYamlFromOpenApiJson(jsonFilePath: string) {
  const jsonData = await fs.readJSON(jsonFilePath);
  const yamlData = JSONTOYAML.stringify(jsonData);
  const yamlFile = "docs/opanApiDoc.yaml";
  await fs.outputFile(yamlFile, yamlData);
  return yamlFile;
}

function generateParameters(params: string[] = [], fields: Field[] = []) {
  const parameters: {
    name: string;
    in: "path" | "query";
    required: boolean;
    description: string;
    schema: {
      type: string;
      enum?: string[];
    };
  }[] = [];

  params.forEach((param) => {
    parameters.push({
      name: param,
      in: "path",
      required: true,
      description: "",
      schema: {
        type: "string",
      },
    });
  });

  fields.forEach((param) => {
    const parameter = {
      name: typeof param === "string" ? param.replace("!", "") : param.name,
      in: "query",
      required:
        typeof param === "string"
          ? isFieldRequired(param)
          : typeof param.optional === "boolean"
          ? param.optional
          : false,
      description: typeof param === "string" ? "" : param.description || "",
      schema: {
        type:
          typeof param === "string"
            ? "string"
            : _getOpenApiType(param.type) || "string",
      },
    };

    if (typeof param === "object" && param.enum) {
      // @ts-ignore
      parameter.schema["enum"] = param.enum;
    }

    // @ts-ignore
    parameters.push(parameter);
  });
  return parameters;
}

function _getOpenApiType(type?: string) {
  if (!type) {
    return "string";
  }

  if (type === "number") {
    return "integer";
  }
  return type;
}

function _extractTag(route: string) {
  // will remove the /
  let currentRoute = route.substring(1);

  if (!currentRoute.length) {
    return undefined;
  }

  return {
    tags: [
      currentRoute.substring(
        0,
        currentRoute.indexOf("/") === -1
          ? undefined
          : currentRoute.indexOf("/"),
      ),
    ],
  };
}
