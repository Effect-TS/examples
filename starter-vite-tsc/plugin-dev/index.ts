import { createFilter } from "@rollup/pluginutils";
import fs from "fs";
import * as nodePath from "path";
import ts from "typescript";
import type * as V from "vite";
import reactPlugin, { Options } from "@vitejs/plugin-react";

const configPath = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");

if (!configPath) {
  throw new Error('Could not find a valid "tsconfig.json".');
}

const baseDir = nodePath.dirname(nodePath.resolve(configPath));
const cacheDir = nodePath.join(baseDir, ".cache/effect");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const registry = ts.createDocumentRegistry();
const files = new Set<string>();

let services: ts.LanguageService;

const getScriptVersion = (fileName: string): string => {
  const modified = ts.sys.getModifiedTime!(fileName);
  if (modified) {
    return ts.sys.createHash!(`${fileName}${modified.toISOString()}`);
  } else {
    files.delete(fileName);
  }
  return "none";
};

const init = () => {
  const { config } = ts.parseConfigFileTextToJson(
    configPath,
    ts.sys.readFile(configPath)!
  );

  Object.assign(config.compilerOptions, {
    sourceMap: false,
    inlineSourceMap: true,
    inlineSources: true,
    noEmit: false,
    declaration: false,
    declarationMap: false,
    module: "ESNext",
    target: "ES2022",
  });

  const tsconfig = ts.parseJsonConfigFileContent(config, ts.sys, baseDir!);

  if (!tsconfig.options) tsconfig.options = {};

  tsconfig.fileNames.forEach((fileName) => {
    files.add(fileName);
  });

  const servicesHost: ts.LanguageServiceHost = {
    realpath: (fileName) => ts.sys.realpath?.(fileName) ?? fileName,
    getScriptFileNames: () => Array.from(files),
    getScriptVersion: getScriptVersion,
    getScriptSnapshot: (fileName) => {
      if (!ts.sys.fileExists(fileName)) {
        return undefined;
      }
      return ts.ScriptSnapshot.fromString(
        ts.sys.readFile(fileName)!.toString()
      );
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => tsconfig.options,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (fileName) => ts.sys.fileExists(fileName),
    readFile: (fileName) => ts.sys.readFile(fileName),
  };

  const services = ts.createLanguageService(servicesHost, registry);

  setTimeout(() => {
    services.getProgram();
  }, 200);

  return services;
};

const getEmit = (path: string) => {
  files.add(path);

  const program = services.getProgram()!;
  const source = program.getSourceFile(path);

  let text: string | undefined;

  program.emit(
    source,
    (file, content) => {
      if (file.endsWith(".js") || file.endsWith(".jsx")) {
        text = content;
      }
    },
    void 0,
    void 0
  );

  if (!text) {
    throw new Error(`Typescript failed emit for file: ${path}`);
  }

  return text;
};

const cache = new Map<string, { hash: string; content: string }>();

export const fromCache = (fileName: string) => {
  const current = getScriptVersion(fileName);
  if (cache.has(fileName)) {
    const cached = cache.get(fileName)!;
    if (cached.hash === current) {
      return cached.content;
    }
  }
  const path = nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.hash`);
  if (fs.existsSync(path)) {
    const hash = fs.readFileSync(path).toString("utf-8");
    if (hash === current) {
      return fs
        .readFileSync(
          nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.content`)
        )
        .toString("utf-8");
    }
  }
};

export const toCache = (fileName: string, content: string) => {
  const current = getScriptVersion(fileName);
  const path = nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.hash`);
  fs.writeFileSync(path, current);
  fs.writeFileSync(
    nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.content`),
    content
  );
  cache.set(fileName, { hash: current, content });
  return content;
};

export const getCompiled = (path: string) => {
  const cached = fromCache(path);
  if (cached) {
    return {
      code: cached,
    };
  }

  const syntactic = services.getSyntacticDiagnostics(path);

  if (syntactic.length > 0) {
    throw new Error(
      syntactic
        .map((_) => ts.flattenDiagnosticMessageText(_.messageText, "\n"))
        .join("\n")
    );
  }

  const semantic = services.getSemanticDiagnostics(path);
  services.cleanupSemanticCache();

  if (semantic.length > 0) {
    throw new Error(
      semantic
        .map((_) => ts.flattenDiagnosticMessageText(_.messageText, "\n"))
        .join("\n")
    );
  }

  const code = toCache(path, getEmit(path));

  return {
    code,
  };
};

export function effectPlugin(options?: Options): V.PluginOption[] {
  const filter = createFilter(options?.include, options?.exclude);
  if (!services) {
    services = init();
  }
  const plugin: V.PluginOption = {
    name: "vite:typescript-effect",
    enforce: "pre",
    configureServer(dev) {
      dev.watcher.on("all", (event, path) => {
        if (filter(path)) {
          if (/\.tsx?/.test(path)) {
            switch (event) {
              case "add": {
                files.add(path);
                break;
              }
              case "change": {
                files.add(path);
                break;
              }
              case "unlink": {
                files.delete(path);
                break;
              }
            }
          }
        }
      });
    },
    watchChange(path, change) {
      if (filter(path)) {
        if (/\.tsx?/.test(path)) {
          switch (change.event) {
            case "create": {
              files.add(path);
              break;
            }
            case "update": {
              files.add(path);
              break;
            }
            case "delete": {
              files.delete(path);
              break;
            }
          }
        }
      }
    },
    transform(_, path) {
      if (/\.tsx?/.test(path) && filter(path)) {
        return getCompiled(path);
      }
    },
  };
  return [plugin, ...reactPlugin(options)];
}
