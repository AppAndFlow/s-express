import fs from "fs-extra";
import klaw from "klaw";
import { getConfig } from "./store";

export async function generateClient() {
  setTimeout(async () => {
    const config = getConfig();
    const controllerPath = `${process.cwd()}/${config.controllersPath}`.replace(
      "dist",
      "src"
    );
    const paths = await getFilesForDir(controllerPath);
    const validPaths = paths.filter((path) => path.includes(".ts"));
    let fnString = "";
    for (const path of validPaths) {
      const file = await fs.readFile(path, "utf8");
      const routeDeclarations = await findAllAddRouteOccurences(path);

      const routeDatas = routeDeclarations.map((index) =>
        findReturnedValue(file.slice(index))
      );
      await findFunctionsData(routeDatas);

      fnString += await composeClientFunctions(routeDatas);
    }

    await composeClientClass(fnString);
  }, 1000);
}

async function composeClientClass(fnString: string) {
  let classTemplate = await fs.readFile(
    `${process.cwd()}/src/lib/clientClassTemplate.txt`,
    "utf8"
  );
  classTemplate = classTemplate.replace("FUNCTIONS", fnString);
  await fs.writeFile("./test.txt", classTemplate);
}

async function composeClientFunctions(routeDatas: RouteData[]) {
  const fnTemplate = await fs.readFile(
    `${process.cwd()}/src/lib/clientFunctionTemplate.txt`,
    "utf8"
  );

  let fnsString = "\n";

  routeDatas.forEach((routeData) => {
    let fnText = fnTemplate;
    fnText = fnText.replace("RETURNED_TYPE", routeData.returnedType);
    fnText = fnText.replace("HTTP_METHOD", routeData.httpMethod.toLowerCase());
    fnText = fnText.replace("HTTP_METHOD", routeData.httpMethod.toLowerCase());
    fnText = fnText.replace("ROUTE_URL", routeData.urlPath);

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
  const addRouteLocations = multiSearchOr(file, ["addRoute"]); // Todo add support for other thing then "addRoute"
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
  }
  return res;
}

function multiSearchOr(text: string, searchWords: string[]) {
  const indexes: number[] = [];
  let copy = text;
  while (copy.indexOf(searchWords[0]) !== -1) {
    for (var i = 0; i < searchWords.length; i++) {
      const index = copy.indexOf(searchWords[i]);
      if (index !== -1) {
        if (
          copy[index + searchWords[i].length] === "(" ||
          copy[index + searchWords[i].length] === "<"
        ) {
          // it's a route declaration
          indexes.push(copy.indexOf(searchWords[i]));
        }

        copy = copy.replace(searchWords[i], "");
      }
    }
  }

  return indexes;
}
