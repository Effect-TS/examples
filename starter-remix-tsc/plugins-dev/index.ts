import * as babel from "@babel/core";
import * as nodePath from "path";
import * as path from "path";
import * as fs from "fs";
import ts from "typescript";

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
const babelConfigPath = nodePath.join(baseDir, "babel.config.js");

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
  const { config } = ts.parseConfigFileTextToJson(configPath, ts.sys.readFile(configPath)!);

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
      return ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName)!.toString());
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
      if (file.endsWith(".js")) {
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
        .readFileSync(nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.content`))
        .toString("utf-8");
    }
  }
};

export const toCache = (fileName: string, content: string) => {
  const current = getScriptVersion(fileName);
  const path = nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.hash`);
  fs.writeFileSync(path, current);
  fs.writeFileSync(nodePath.join(cacheDir, `${ts.sys.createHash!(fileName)}.content`), content);
  cache.set(fileName, { hash: current, content });
  return content;
};

export const plugin = (_isBrowser: any, _config: any, _options: any) => {
  return {
    name: "effect-plugin",
    setup(build: any) {
      if (baseDir) {
        const config = require(path.join(baseDir!, "/remix.config.js"));
        let useBabel = false;
        if (babelConfigPath && ts.sys.fileExists(babelConfigPath)) {
          if (config.future && "babel" in config.future && !config.future.babel) {
            // config found but babel is disabled
          } else {
            useBabel = true;
          }
        }
        if (config.future && config.future.typescript && useBabel) {
          if (!services) {
            services = init();
          }
          build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, (args: any) => {
            const cached = fromCache(args.path);
            if (cached) {
              return {
                contents: cached,
                loader: "js",
              };
            }
            const result = babel.transformSync(getEmit(args.path), {
              filename: args.path,
              configFile: babelConfigPath,
              sourceMaps: "inline",
            });
            if (result?.code) {
              return {
                contents: toCache(args.path, result?.code),
                loader: "js",
              };
            }
            throw new Error(`Babel failed emit for file: ${args.path}`);
          });
        } else if (config.future && config.future.typescript) {
          if (!services) {
            services = init();
          }
          build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, (args: any) => {
            const cached = fromCache(args.path);
            if (cached) {
              return {
                contents: cached,
                loader: "js",
              };
            }
            return {
              contents: toCache(args.path, getEmit(args.path)),
              loader: "js",
            };
          });
        } else if (useBabel) {
          build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, (args: any) => {
            const cached = fromCache(args.path);
            if (cached) {
              return {
                contents: cached,
                loader: "js",
              };
            }
            const result = babel.transformFileSync(args.path, {
              configFile: babelConfigPath,
              sourceMaps: "inline",
            });
            if (result?.code) {
              return {
                contents: toCache(args.path, result?.code),
                loader: "js",
              };
            }
            throw new Error(`Babel failed emit for file: ${args.path}`);
          });
        }
      }
    },
  };
};
