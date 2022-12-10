"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
exports.__esModule = true;
exports.plugin = void 0;
var nodePath = __importStar(require("path"));
var ts = __importStar(require("typescript"));
var registry = ts.createDocumentRegistry();
var files = new Set();
var services;
var init = function () {
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
            var modified = ts.sys.getModifiedTime(fileName);
            if (modified) {
                return ts.sys.createHash("".concat(fileName).concat(modified.toISOString()));
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
    return ts.createLanguageService(servicesHost, registry);
};
var cache = new Map();
var getEmit = function (path) {
    files.add(path);
    var program = services.getProgram();
    var source = program.getSourceFile(path);
    // @ts-expect-error
    var hash = source["version"];
    if (cache.has(path)) {
        var cached = cache.get(path);
        if (cached.hash === hash) {
            return cached.text;
        }
        cache["delete"](path);
    }
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
    var text;
    program.emit(source, function (file, content) {
        if (file.endsWith(".js")) {
            text = content;
        }
    }, void 0, void 0, { after: [transformer] });
    if (!text) {
        throw new Error("Typescript failed emit for file: ".concat(path));
    }
    cache.set(path, { hash: hash, text: text });
    return text;
};
var plugin = function () {
    if (!services) {
        services = init();
    }
    return {
        name: "ts-plugin",
        setup: function (build) {
            build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                return {
                    contents: getEmit(args.path),
                    loader: "js"
                };
            });
        }
    };
};
exports.plugin = plugin;
