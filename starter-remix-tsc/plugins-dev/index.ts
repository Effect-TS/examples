import * as babel from "@babel/core";
import * as nodePath from "path";
import * as path from "path";
import ts from "typescript";

const configPath = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");
const baseDir = configPath
  ? nodePath.dirname(nodePath.resolve(configPath))
  : undefined;

const registry = ts.createDocumentRegistry();
const files = new Set<string>();
const babelConfigPath = baseDir
  ? nodePath.join(baseDir, "babel.config.js")
  : undefined;

let services: ts.LanguageService;

const init = () => {
  if (!configPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
  }

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
    getScriptVersion: (fileName) => {
      const modified = ts.sys.getModifiedTime!(fileName);
      if (modified) {
        return ts.sys.createHash!(`${fileName}${modified.toISOString()}`);
      } else {
        files.delete(fileName);
      }
      return "none";
    },
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

  return ts.createLanguageService(servicesHost, registry);
};

const cache = new Map<string, { hash: string; text: string }>();

const getEmit = (path: string) => {
  files.add(path);
  const program = services.getProgram()!;
  const source = program.getSourceFile(path);
  // @ts-expect-error
  const hash = source["version"];
  if (cache.has(path)) {
    const cached = cache.get(path)!;
    if (cached.hash === hash) {
      return cached.text;
    }
    cache.delete(path);
  }
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
  cache.set(path, { hash, text });
  return text;
};

export const plugin = (_isBrowser: any, _config: any, _options: any) => {
  return {
    name: "effect-plugin",
    setup(build: any) {
      if (baseDir) {
        const config = require(path.join(baseDir!, "/remix.config.js"));
        let useBabel = false;
        if (babelConfigPath && ts.sys.fileExists(babelConfigPath)) {
          if (
            config.future &&
            "babel" in config.future &&
            !config.future.babel
          ) {
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
            const result = babel.transformSync(getEmit(args.path), {
              filename: args.path,
              configFile: babelConfigPath,
              sourceMaps: "inline",
            });
            if (result?.code) {
              return {
                contents: result?.code,
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
            return {
              contents: getEmit(args.path),
              loader: "js",
            };
          });
        } else if (useBabel) {
          build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, (args: any) => {
            const result = babel.transformFileSync(args.path, {
              configFile: babelConfigPath,
              sourceMaps: "inline",
            });
            if (result?.code) {
              return {
                contents: result?.code,
                loader: args.path.endsWith("tsx") ? "jsx" : "js",
              };
            }
            throw new Error(`Babel failed emit for file: ${args.path}`);
          });
        }
      }
    },
  };
};
