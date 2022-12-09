import * as crypto from "crypto";
import * as nodePath from "path";
import * as ts from "typescript";

const registry = ts.createDocumentRegistry();

let tsPlugin = (isClient: boolean) => {
  const files = new Set<string>();

  const configPath = ts.findConfigFile(
    "./",
    ts.sys.fileExists,
    "tsconfig.json"
  );

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

  const baseDir = nodePath.dirname(nodePath.resolve(configPath));
  const tsconfig = ts.parseJsonConfigFileContent(config, ts.sys, baseDir);

  if (!tsconfig.options) tsconfig.options = {};

  tsconfig.fileNames.forEach((fileName) => {
    files.add(fileName);
  });

  const servicesHost: ts.LanguageServiceHost = {
    realpath: (fileName) => ts.sys.realpath?.(fileName) ?? fileName,
    getScriptFileNames: () => Array.from(files),
    getScriptVersion: (fileName) => {
      const fileBuffer = ts.sys.readFile(fileName);
      if (fileBuffer) {
        const hashSum = crypto.createHash("sha256");
        hashSum.update(fileBuffer, "utf-8");
        return hashSum.digest("hex");
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

  const services = ts.createLanguageService(servicesHost, registry);

  return {
    name: "ts-plugin",
    setup(build: any) {
      build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, (args: any) => {
        const path = args.path;
        files.add(path);
        const program = services.getProgram()!;
        const source = program.getSourceFile(path);
        const transformer: ts.TransformerFactory<ts.SourceFile> = (ctx) => {
          return (file) => {
            if (file.isDeclarationFile) {
              return file;
            }
            const visitor =
              (add: boolean) =>
              (node: ts.Node): ts.Node => {
                if (ts.isBlock(node)) {
                  return ts.visitEachChild(node, visitor(false), ctx);
                }
                if (ts.isCallExpression(node) && add) {
                  return ts.addSyntheticLeadingComment(
                    ts.visitEachChild(node, visitor(add), ctx),
                    ts.SyntaxKind.MultiLineCommentTrivia,
                    "@__PURE__",
                    false
                  );
                }
                return ts.visitEachChild(node, visitor(add), ctx);
              };
            const statements: Array<ts.Statement> = [];
            for (const statement of file.statements) {
              if (ts.isVariableStatement(statement)) {
                statements.push(ts.visitNode(statement, visitor(true)));
              } else {
                statements.push(statement);
              }
            }
            return ctx.factory.updateSourceFile(
              file,
              statements,
              file.isDeclarationFile,
              file.referencedFiles,
              file.typeReferenceDirectives,
              file.hasNoDefaultLib,
              file.libReferenceDirectives
            );
          };
        };
        const transformers: ts.CustomTransformers["before"] = [];
        if (isClient) {
          transformers.push(transformer);
        }
        let text;
        program.emit(
          source,
          (file, content) => {
            if (file.endsWith(".js")) {
              text = content;
            }
          },
          void 0,
          void 0,
          { after: transformers }
        );
        return {
          contents: text,
          loader: "js",
        };
      });
    },
  };
};

exports.tsPlugin = tsPlugin;
