"use strict";
exports.__esModule = true;
var crypto = require("crypto");
var nodePath = require("path");
var ts = require("typescript");
var tsPlugin = function (isClient) {
    var registry = ts.createDocumentRegistry();
    var files = new Set();
    var configPath = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");
    if (!configPath) {
        throw new Error('Could not find a valid "tsconfig.json".');
    }
    var config = ts.parseConfigFileTextToJson(configPath, ts.sys.readFile(configPath)).config;
    Object.assign(config.compilerOptions, {
        sourceMap: false,
        inlineSourceMap: true,
        inlineSources: true,
        noEmit: false,
        declaration: false,
        declarationMap: false,
        module: "ESNext",
        target: "ES2022"
    });
    var baseDir = nodePath.dirname(nodePath.resolve(configPath));
    var tsconfig = ts.parseJsonConfigFileContent(config, ts.sys, baseDir);
    if (!tsconfig.options)
        tsconfig.options = {};
    tsconfig.fileNames.forEach(function (fileName) {
        files.add(fileName);
    });
    var servicesHost = {
        realpath: function (fileName) { var _a, _b, _c; return (_c = (_b = (_a = ts.sys).realpath) === null || _b === void 0 ? void 0 : _b.call(_a, fileName)) !== null && _c !== void 0 ? _c : fileName; },
        getScriptFileNames: function () { return Array.from(files); },
        getScriptVersion: function (fileName) {
            var fileBuffer = ts.sys.readFile(fileName);
            if (fileBuffer) {
                var hashSum = crypto.createHash("sha256");
                hashSum.update(fileBuffer, "utf-8");
                return hashSum.digest("hex");
            }
            else {
                files["delete"](fileName);
            }
            return "none";
        },
        getScriptSnapshot: function (fileName) {
            if (!ts.sys.fileExists(fileName)) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName).toString());
        },
        getCurrentDirectory: function () { return process.cwd(); },
        getCompilationSettings: function () { return tsconfig.options; },
        getDefaultLibFileName: function (options) { return ts.getDefaultLibFilePath(options); },
        fileExists: function (fileName) { return ts.sys.fileExists(fileName); },
        readFile: function (fileName) { return ts.sys.readFile(fileName); }
    };
    var services = ts.createLanguageService(servicesHost, registry);
    return {
        name: "ts-plugin",
        setup: function (build) {
            build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                var path = args.path;
                files.add(path);
                var program = services.getProgram();
                var source = program.getSourceFile(path);
                var transformer = function (ctx) {
                    return function (file) {
                        if (file.isDeclarationFile) {
                            return file;
                        }
                        var visitor = function (add) {
                            return function (node) {
                                if (ts.isBlock(node)) {
                                    return ts.visitEachChild(node, visitor(false), ctx);
                                }
                                if (ts.isCallExpression(node) && add) {
                                    return ts.addSyntheticLeadingComment(ts.visitEachChild(node, visitor(add), ctx), ts.SyntaxKind.MultiLineCommentTrivia, "@__PURE__", false);
                                }
                                return ts.visitEachChild(node, visitor(add), ctx);
                            };
                        };
                        var statements = [];
                        for (var _i = 0, _a = file.statements; _i < _a.length; _i++) {
                            var statement = _a[_i];
                            if (ts.isVariableStatement(statement)) {
                                statements.push(ts.visitNode(statement, visitor(true)));
                            }
                            else {
                                statements.push(statement);
                            }
                        }
                        return ctx.factory.updateSourceFile(file, statements, file.isDeclarationFile, file.referencedFiles, file.typeReferenceDirectives, file.hasNoDefaultLib, file.libReferenceDirectives);
                    };
                };
                var transformers = [];
                if (isClient) {
                    transformers.push(transformer);
                }
                var text;
                program.emit(source, function (file, content) {
                    if (file.endsWith(".js")) {
                        text = content;
                    }
                }, void 0, void 0, { after: transformers });
                return {
                    contents: text,
                    loader: "js"
                };
            });
        }
    };
};
exports.tsPlugin = tsPlugin;
