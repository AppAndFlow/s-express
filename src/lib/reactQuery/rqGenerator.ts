import fs from "fs-extra";

import {
  RouteData,
  correctTypeIfClientTypePathIsDefined,
} from "../clientGenerator";
import { getRoutes } from "../store";

export async function composeQueries(routeDatas: RouteData[]) {
  const fnTemplate = await fs.readFile(
    `${process.cwd()}/node_modules/@appandflow/s-express/dist/lib/reactQuery/rqQueryTemplate.txt`,
    "utf8"
  );

  let importPrefx = "";

  if (process.env.CLIENT_TYPE_PATH) {
    importPrefx = "ALL_TYPES.";
  }

  let fnsString = "\n";

  routeDatas.forEach((routeData) => {
    if (routeData.httpMethod !== "GET") {
      return;
    }

    //console.log(routeData);

    let fnText = fnTemplate;

    routeData.returnedType = correctTypeIfClientTypePathIsDefined(
      routeData.returnedType
    );

    let unPromisedReturnedType = routeData.returnedType.replace("Promise<", "");
    unPromisedReturnedType = unPromisedReturnedType.replace(">", "");

    console.log(unPromisedReturnedType);

    fnText = fnText.replaceAll("RETURNED_TYPE", unPromisedReturnedType);
    fnText = fnText.replaceAll(
      "HTTP_METHOD",
      routeData.httpMethod.toLowerCase()
    );
    fnText = fnText.replaceAll(
      "HTTP_METHOD",
      routeData.httpMethod.toLowerCase()
    );
    fnText = fnText.replaceAll("ROUTE_URL", routeData.urlPath);

    const associatedRoute = getRoutes().find(
      (route) =>
        route.method === routeData.httpMethod &&
        route.path === routeData.urlPath
    );

    if (
      associatedRoute &&
      associatedRoute.description &&
      associatedRoute.path
    ) {
      fnText = fnText.replaceAll(
        "FUNCTION_DOC",
        `/**
         * ${associatedRoute.description}
  
         * \`${associatedRoute.method} ${associatedRoute.path}\`
        */`
      );
    } else {
      fnText = fnText.replaceAll("FUNCTION_DOC", "");
    }

    if (routeData.payloadType === "void" || !routeData.payloadType) {
      fnText = fnText.replaceAll("payload: PAYLOAD_TYPE,", "");
      fnText = fnText.replaceAll("PAYLOAD_TO_SEND", "");
    } else {
      routeData.payloadType = correctTypeIfClientTypePathIsDefined(
        routeData.payloadType
      );

      fnText = fnText.replaceAll("PAYLOAD_TYPE", routeData.payloadType);
      fnText = fnText.replaceAll("PAYLOAD_TO_SEND", "payload");
    }

    let tempName = "";
    let fnName = `${routeData.httpMethod.toLowerCase()}`;
    let nextIsCapital = false;
    for (let i = 0; i < routeData.urlPath.length; i++) {
      if (routeData.urlPath[i] === "/") {
        nextIsCapital = true;
      } else {
        if (nextIsCapital) {
          tempName += routeData.urlPath[i].toUpperCase();
          nextIsCapital = false;
        } else {
          tempName += routeData.urlPath[i];
        }
      }
    }

    if (routeData.string) {
      const capitalizedFunctionName = `${routeData.string[0].toUpperCase()}${routeData.string.slice(
        1
      )}`;

      fnText = fnText.replace("FUNCTION_NAME", capitalizedFunctionName); // important we just want the first one to be capitalized
      fnText = fnText.replaceAll("FUNCTION_NAME", routeData.string); // that one should remain uncapitalized
      // if for some reason the function has no name, we wont add it.
      // this is an indication of a bug
      fnsString += fnText + "\n";
    }
  });

  console.log(fnsString);
  return fnsString;
}

export async function composeReactQueryFile({
  fnString,
  interfaceString,
  interfaceList,
}: {
  fnString: string;
  interfaceString: string;
  interfaceList: string[];
}) {
  let destination = "./reactQuery/";

  if (process.env.CLIENT_DESTINATION) {
    destination = process.env.CLIENT_DESTINATION;
  }

  await fs.ensureDir(destination);

  let classTemplate = await fs.readFile(
    `${process.cwd()}/node_modules/@appandflow/s-express/dist/lib/reactQuery/rqFileTemplate.txt`,
    "utf8"
  );

  classTemplate = classTemplate.replace("FUNCTIONS", fnString);
  classTemplate = classTemplate.replace("// TYPES_CLIENT", interfaceString);

  if (process.env.CLIENT_TYPE_PATH) {
    classTemplate = classTemplate.replace(
      "// TYPES_IMPORT",
      process.env.CLIENT_TYPE_PATH
    );
  } else {
    classTemplate = classTemplate.replace("// TYPES_IMPORT", "");
  }

  // patch work around to remove ".import("../sharedTypes")" bug.
  classTemplate = classTemplate.replaceAll(`import("../sharedTypes").`, "");
  classTemplate = classTemplate.replaceAll(`import("../../sharedTypes").`, "");
  classTemplate = classTemplate.replaceAll(
    `import("../../../sharedTypes").`,
    ""
  );

  // patch work around where we have ALL.TYPES.ALL.TYPES
  classTemplate = classTemplate.replaceAll(`ALL_TYPES.ALL_TYPES`, "ALL_TYPES");

  // patch work around where sometimes we have ALL_TYPES.string, ALL_TYPES.number, ALL_TYPES.boolean
  classTemplate = classTemplate.replaceAll(`ALL_TYPES.string`, "string");
  classTemplate = classTemplate.replaceAll(`ALL_TYPES.number`, "number");
  classTemplate = classTemplate.replaceAll(`ALL_TYPES.boolean`, "boolean");
  classTemplate = classTemplate.replaceAll(`ALL_TYPES.null`, "null");
  classTemplate = classTemplate.replaceAll(`ALL_TYPES.undefined`, "undefined");

  // patch work for some Types that are not correctly set
  const rawInterfaceList = interfaceList.map((type) => {
    let correctedType = type;
    correctedType = correctedType.replaceAll("ALL_TYPES.", "");
    return correctedType;
  });
  rawInterfaceList.forEach((type) => {
    classTemplate = classTemplate.replaceAll(` ${type}`, ` ALL_TYPES.${type}`);
  });

  await fs.writeFile(`${destination}/queries.ts`, classTemplate);
}
