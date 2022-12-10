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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.plugin = void 0;
var babel = __importStar(require("@babel/core"));
var nodePath = __importStar(require("path"));
var path = __importStar(require("path"));
var typescript_1 = __importDefault(require("typescript"));
var configPath = typescript_1["default"].findConfigFile("./", typescript_1["default"].sys.fileExists, "tsconfig.json");
var baseDir = configPath
    ? nodePath.dirname(nodePath.resolve(configPath))
    : undefined;
var registry = typescript_1["default"].createDocumentRegistry();
var files = new Set();
var babelConfigPath = baseDir
    ? nodePath.join(baseDir, "babel.config.js")
    : undefined;
var services;
var init = function () {
    if (!configPath) {
        throw new Error('Could not find a valid "tsconfig.json".');
    }
    var config = typescript_1["default"].parseConfigFileTextToJson(configPath, typescript_1["default"].sys.readFile(configPath)).config;
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
    var tsconfig = typescript_1["default"].parseJsonConfigFileContent(config, typescript_1["default"].sys, baseDir);
    if (!tsconfig.options)
        tsconfig.options = {};
    tsconfig.fileNames.forEach(function (fileName) {
        files.add(fileName);
    });
    var servicesHost = {
        realpath: function (fileName) { var _a, _b, _c; return (_c = (_b = (_a = typescript_1["default"].sys).realpath) === null || _b === void 0 ? void 0 : _b.call(_a, fileName)) !== null && _c !== void 0 ? _c : fileName; },
        getScriptFileNames: function () { return Array.from(files); },
        getScriptVersion: function (fileName) {
            var modified = typescript_1["default"].sys.getModifiedTime(fileName);
            if (modified) {
                return typescript_1["default"].sys.createHash("".concat(fileName).concat(modified.toISOString()));
            }
            else {
                files["delete"](fileName);
            }
            return "none";
        },
        getScriptSnapshot: function (fileName) {
            if (!typescript_1["default"].sys.fileExists(fileName)) {
                return undefined;
            }
            return typescript_1["default"].ScriptSnapshot.fromString(typescript_1["default"].sys.readFile(fileName).toString());
        },
        getCurrentDirectory: function () { return process.cwd(); },
        getCompilationSettings: function () { return tsconfig.options; },
        getDefaultLibFileName: function (options) { return typescript_1["default"].getDefaultLibFilePath(options); },
        fileExists: function (fileName) { return typescript_1["default"].sys.fileExists(fileName); },
        readFile: function (fileName) { return typescript_1["default"].sys.readFile(fileName); }
    };
    return typescript_1["default"].createLanguageService(servicesHost, registry);
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
    var text;
    program.emit(source, function (file, content) {
        if (file.endsWith(".js")) {
            text = content;
        }
    }, void 0, void 0);
    if (!text) {
        throw new Error("Typescript failed emit for file: ".concat(path));
    }
    cache.set(path, { hash: hash, text: text });
    return text;
};
var plugin = function (_isBrowser, _config, _options) {
    return {
        name: "effect-plugin",
        setup: function (build) {
            if (baseDir) {
                var useBabel = false;
                if (babelConfigPath && typescript_1["default"].sys.fileExists(babelConfigPath)) {
                    useBabel = true;
                }
                var config = require(path.join(baseDir, "/remix.config.js"));
                if (config.future && config.future.typescript && useBabel) {
                    if (!services) {
                        services = init();
                    }
                    build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                        var result = babel.transformSync(getEmit(args.path), {
                            filename: args.path,
                            configFile: babelConfigPath,
                            sourceMaps: "inline"
                        });
                        if (result === null || result === void 0 ? void 0 : result.code) {
                            return {
                                contents: result === null || result === void 0 ? void 0 : result.code,
                                loader: "js"
                            };
                        }
                        throw new Error("Babel failed emit for file: ".concat(args.path));
                    });
                }
                else if (config.future && config.future.typescript) {
                    if (!services) {
                        services = init();
                    }
                    build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                        return {
                            contents: getEmit(args.path),
                            loader: "js"
                        };
                    });
                }
                else if (useBabel) {
                    build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                        var result = babel.transformFileSync(args.path, {
                            configFile: babelConfigPath,
                            sourceMaps: "inline"
                        });
                        if (result === null || result === void 0 ? void 0 : result.code) {
                            return {
                                contents: result === null || result === void 0 ? void 0 : result.code,
                                loader: args.path.endsWith("tsx") ? "jsx" : "js"
                            };
                        }
                        throw new Error("Babel failed emit for file: ".concat(args.path));
                    });
                }
            }
        }
    };
};
exports.plugin = plugin;
