import fs from "fs-extra";
import klaw from "klaw";
import { getConfig } from "./store";

export async function generateClient() {
  // TODO we must run tsconfig.js with     "declaration": true,
  // this will generate .d.ts

  if (!process.env.CLIENT_MODE) {
    return;
  }

  setTimeout(async () => {
    const config = getConfig();
    console.log("Client Generation Started.");
    const controllerPath = `${process.cwd()}/${config.controllersPath}`.replace(
      "dist",
      "src"
    );
    const paths = await getFilesForDir(controllerPath);
    const validPaths = paths.filter((path) => path.includes(".ts"));
    let fnString = "";
    let interfaceList: string[] = [];
    let interfaceString = "";
    for (const path of validPaths) {
      const file = await fs.readFile(path, "utf8");
      const routeDeclarations = await findAllAddRouteOccurences(path);
      console.log(path);
      const routeDatas = routeDeclarations.map((index) =>
        findReturnedValue(file.slice(index))
      );
      await findFunctionsData(routeDatas);

      fnString += await composeClientFunctions(routeDatas);
      console.log(routeDatas);

      let interfaces = composeInterfacesList(routeDatas);
      interfaceList = [...interfaceList, ...interfaces];
    }

    interfaceList = [...new Set(interfaceList)];

    console.log(interfaceList);

    // interfaceString = await extractNeededTypesFromProject({ interfaceList }); ------> TODO: review the whole logic to import types.

    await composeClientClass({ fnString, interfaceString });
  }, 1000);
}

async function extractNeededTypesFromProject({
  interfaceList,
  passes = 0,
}: {
  interfaceList: string[];
  passes?: number;
}) {
  console.log("extractNeededTypesFromProject", interfaceList);
  let interfaceString = "";
  let interfaceStringList: string[] = [];
  // Find type location
  const projectPaths = await getFilesForDir(`${process.cwd()}`);
  const projectValidPaths = projectPaths.filter((path) =>
    path.includes("d.ts")
  );
  for (const path of projectValidPaths) {
    const file = await fs.readFile(path, "utf8");

    for (const type of interfaceList) {
      const includeType = file.includes(`interface ${type}`);
      if (includeType) {
        const typeString = await extractSpecificTypeFromFile(path, type);
        if (!interfaceStringList.includes(typeString)) {
          interfaceStringList.push(typeString);
        }
      }
    }
  }

  // TODO find nested Types.
  for (const intstr of interfaceStringList) {
    const nestedTypes = getNestedTypesFromTypeString(intstr);
    console.log("getNestedTypesFromTypeString", nestedTypes);
    if (
      nestedTypes.length &&
      !interfaceList.includes(intstr) &&
      !nestedTypes.includes(intstr) &&
      passes <= 3
    ) {
      const nestedInterfaces = await extractNeededTypesFromProject({
        interfaceList: [...new Set([...nestedTypes, ...interfaceList])],
        passes: passes + 1,
      });

      interfaceStringList = [
        ...new Set([...interfaceStringList, nestedInterfaces]),
      ];
    }
  }

  interfaceStringList.forEach((intstr) => {
    interfaceString += intstr + "\n";
  });

  console.log(interfaceStringList);

  return interfaceString;
}

function getNestedTypesFromTypeString(type: string) {
  const nestedTypeName: string[] = [];
  let level = 0;
  let startIndex = type.indexOf("{");
  let isScaningType = false;
  let tempNestedType = "";
  for (let i = startIndex; i < type.length; i++) {
    if (type[i] === "{") {
      level++;
      isScaningType = false; // it's an inline type
    }
    if (type[i] === "}") {
      if (level === 0) {
        break; // end of type
      } else {
        level--;
      }
    }
    if (type[i] === ":") {
      isScaningType = true;
      // we found type declaration
    } else if (isScaningType) {
      if (type[i] === ";") {
        // end of type declaration;
        isScaningType = false;
        tempNestedType = tempNestedType.trim();
        tempNestedType = tempNestedType.replace("]", "");
        tempNestedType = tempNestedType.replace("[", "");
        if (
          !tempNestedType.includes("boolean") &&
          !tempNestedType.includes("string") &&
          !tempNestedType.includes("number") &&
          !tempNestedType.includes("any") &&
          !tempNestedType.includes("void")
        ) {
          nestedTypeName.push(tempNestedType);
        }

        tempNestedType = "";
      } else {
        tempNestedType += type[i];
      }
    }
  }

  return [...new Set([...nestedTypeName])];
}

async function extractSpecificTypeFromFile(filePath: string, typeName: string) {
  let finalStr = "";
  const fileString = await fs.readFile(filePath, "utf8");
  const typeStartIndex = fileString.indexOf("interface " + typeName);
  if (typeStartIndex === -1) {
    return finalStr;
  }
  let level = 0;
  let gotCore = false;
  for (let i = typeStartIndex; i < fileString.length; i++) {
    finalStr += fileString[i];

    if (fileString[i] === "{") {
      if (gotCore) {
        level += 1;
      } else {
        gotCore = true;
      }
    }
    if (fileString[i] === "}") {
      if (level === 0) {
        break;
      } else {
        level -= 1;
      }
    }
  }
  if (finalStr.length) {
    return finalStr;
  }
  return finalStr;
}

function composeInterfacesList(routeDatas: RouteData[]) {
  let interfaces: string[] = [];
  routeDatas.forEach((route) => {
    if (route.returnedType.includes("Promise<")) {
      const returnedType = route.returnedType;
      const startIndex = returnedType.indexOf("Promise<") + 8;
      let interfaceName = "";
      for (let i = startIndex; i < returnedType.length; i++) {
        if (returnedType[i] === "{" || returnedType[i] === "[") {
          break; // it's an inline type
        }
        if (returnedType[i] === ">") {
          break; // it's the end
        }
        interfaceName += returnedType[i];
      }
      interfaceName = interfaceName.replace("[]", "");
      interfaceName = interfaceName.trim();
      if (
        interfaceName.length &&
        interfaceName !== "void" &&
        interfaceName !== "any"
      ) {
        interfaces.push(interfaceName);
      }
    }
  });

  interfaces = [...new Set(interfaces)];

  return interfaces;
}

async function composeClientClass({
  fnString,
  interfaceString,
}: {
  fnString: string;
  interfaceString: string;
}) {
  let destination = "./sexpress/";

  if (process.env.CLIENT_DESTINATION) {
    destination = process.env.CLIENT_DESTINATION;
  }

  await fs.ensureDir(destination);

  let classTemplate = await fs.readFile(
    `${process.cwd()}/node_modules/@appandflow/s-express/dist/lib/clientClassTemplate.txt`,
    "utf8"
  );
  let exportTemplate = await fs.readFile(
    `${process.cwd()}/node_modules/@appandflow/s-express/dist/lib/clientExportTemplate.txt`,
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

  await fs.writeFile(`${destination}/sexpressClass.ts`, classTemplate);
  const exists = await fs.pathExists(`${destination}/index.ts`);
  if (!exists) {
    await fs.writeFile(`${destination}/index.ts`, exportTemplate);
  }

  console.log(`Client generated at ${destination}`);
  process.exit();
}

async function composeClientFunctions(routeDatas: RouteData[]) {
  const fnTemplate = await fs.readFile(
    `${process.cwd()}/node_modules/@appandflow/s-express/dist/lib/clientFunctionTemplate.txt`,
    "utf8"
  );

  let fnsString = "\n";

  routeDatas.forEach((routeData) => {
    let fnText = fnTemplate;
    fnText = fnText.replace("RETURNED_TYPE", routeData.returnedType);
    fnText = fnText.replace("HTTP_METHOD", routeData.httpMethod.toLowerCase());
    fnText = fnText.replace("HTTP_METHOD", routeData.httpMethod.toLowerCase());
    fnText = fnText.replace("ROUTE_URL", routeData.urlPath);

    if (routeData.payloadType === "void" || !routeData.payloadType) {
      fnText = fnText.replace("payload: PAYLOAD_TYPE", "");
      fnText = fnText.replace(", PAYLOAD_TO_SEND", "");
    } else {
      fnText = fnText.replace("PAYLOAD_TYPE", routeData.payloadType);
      fnText = fnText.replace("PAYLOAD_TO_SEND", "payload");
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
    // fnText = fnText.replace("FUNCTION_NAME", `${fnName}${tempName}`); // lets use the function name for now
    fnText = fnText.replace("FUNCTION_NAME", routeData.string);

    fnsString += fnText + "\n";
  });
  return fnsString;
}

async function findFunctionsData(routeDatas: RouteData[]) {
  // We now need to find the function .d.ts in the dist folder
  const distPath = `${process.cwd()}/dist`; // TODO add support for custom dist
  const paths = await getFilesForDir(distPath);
  const validPaths = paths.filter((path) => path.includes(".d.ts"));
  for (const path of validPaths) {
    for (const routeData of routeDatas) {
      await extractReturnedValueFromFunction(path, routeData);
    }
  }
}

async function extractReturnedValueFromFunction(
  filePath: string,
  routeData: RouteData
) {
  const file = await fs.readFile(filePath, "utf8");

  const fnIndex = file.indexOf(routeData.string);

  if (fnIndex !== -1) {
    const fnStart = file.substring(fnIndex);
    let startTypeIndex = fnStart.indexOf("):");

    if (startTypeIndex !== -1) {
      startTypeIndex += 2;
      const isPromise = fnStart
        .substring(startTypeIndex, startTypeIndex + 15)
        .includes("Promise<");

      if (isPromise) {
        const type =
          fnStart.substring(startTypeIndex, fnStart.indexOf(">;")) + ">";
        routeData.returnedType = type;
      }
    }
  }
}

async function findAllAddRouteOccurences(filePath: string) {
  const file = await fs.readFile(filePath, "utf8");
  const addRouteLocations = [
    ...searchIndexes(file, "addRoute<"),
    ...searchIndexes(file, "addRoute("),
  ]; // Todo add support for other thing then "addRoute"
  return addRouteLocations;
}

async function getFilesForDir(dirPath: string): Promise<string[]> {
  return new Promise((resolve) => {
    const items: string[] = [];
    klaw(dirPath, { depthLimit: -1 })
      .on("data", (item: { path: string }) => items.push(item.path))
      .on("end", () => resolve(items));
  });
}

interface RouteData {
  string: string;
  type: "object" | "function" | "variable";
  isImported: boolean;
  importLocation: string;
  isComposed: boolean;
  composedString: string;
  urlPath: string;
  httpMethod: string;
  returnedType: string;
  payloadType: string;
}

function findReturnedValue(str: string) {
  const res: RouteData = {
    string: "",
    type: "object",
    isImported: false,
    importLocation: "",
    isComposed: false,
    composedString: "",
    urlPath: "/",
    httpMethod: "GET",
    returnedType: "void",
    payloadType: "void",
  };
  const returnIndex = str.indexOf("return");

  let valueStartIndex = 0;
  if (returnIndex !== -1) {
    valueStartIndex = returnIndex + 7; // "return " string index
    if (str[valueStartIndex + 1] === "{") {
      res.type = "object";
      // todo handle object
    } else {
      // function/variable case
      // i.e: "service.function" or "function" or "variable"

      let string = "";
      for (let i = valueStartIndex; i < str.length; i++) {
        if (str[i] === "(") {
          // it's a function
          res.type = "function";
          res.string = string;
          res.isImported = true; // TODO for now we will suppose it's imported
          break;
        } else if (str[i] === ".") {
          res.isComposed = true;
          res.composedString = string; // todo handle multiple level of composition i.e: services.a.b.c
          string = "";
        } else {
          string += str[i];
        }
      }
    }

    // now we need to figure out the url path
    const pathStartIndex = str.indexOf("path");
    if (pathStartIndex !== -1) {
      const startIndex = pathStartIndex + 5; // +path.length + ":"
      let stringStartPosition = -1;
      let endChar;
      for (let i = startIndex; i < str.length; i++) {
        if ((str[i] === '"' || str[i] === "`" || str[i] === "'") && !endChar) {
          // start
          endChar = str[i];
          stringStartPosition = i + 1;
        } else if (endChar) {
          if (str[i] === endChar) {
            res.urlPath = str.substring(stringStartPosition, i);
            break;
          }
        }
      }
    }

    // now we need to figure out the http method
    const methodStartIndex = str.indexOf("method");
    if (methodStartIndex !== -1) {
      const startIndex = methodStartIndex + 7; // +method.length + ":"
      let stringStartPosition = -1;
      let endChar;
      for (let i = startIndex; i < str.length; i++) {
        if ((str[i] === '"' || str[i] === "`" || str[i] === "'") && !endChar) {
          // start
          endChar = str[i];
          stringStartPosition = i + 1;
        } else if (endChar) {
          if (str[i] === endChar) {
            res.httpMethod = str.substring(stringStartPosition, i);
            break;
          }
        }
      }
    }

    // Now we will figure out the payload type
    const startIndex = str.indexOf("addRoute<"); // we only support addRoute for now.

    if (startIndex !== -1) {
      let payloadType = "";
      let isInline = false;
      let level = 0;
      for (let i = startIndex + "addRoute<".length; i < str.length; i++) {
        if (str[i] === "(") {
          // instant break it's void type.
          break;
        }

        payloadType += str[i];
        if (str[i] === "{") {
          if (!isInline) {
            isInline = true;
          } else {
            level += 1;
          }
        }
        if (str[i] === "}" && isInline) {
          if (level !== 0) {
            level -= 1;
          } else {
            break; // end of inline object
          }
        }
        if (!isInline && str[i] !== "{") {
          if (str[i] === ">" || str[i] === ",") {
            if (str[i] === ",") {
              payloadType = payloadType.substring(0, payloadType.length - 1);
            }
            // we wont support nested generic type for now i.e: A<B<c>> // TODO add support for partial.
            break;
          }
        }
      }
      if (payloadType.length) {
        res.payloadType = payloadType;
      }
    }
  }
  return res;
}

function searchIndexes(source: string, find: string) {
  if (!source) {
    return [];
  }
  // if find is empty string return all indexes.
  if (!find) {
    // or shorter arrow function:
    // return source.split('').map((_,i) => i);
    return source.split("").map(function(_, i) {
      return i;
    });
  }
  const result = [];
  for (let i = 0; i < source.length; ++i) {
    // If you want to search case insensitive use
    // if (source.substring(i, i + find.length).toLowerCase() == find) {
    if (source.substring(i, i + find.length) == find) {
      result.push(i);
    }
  }
  return result;
}
