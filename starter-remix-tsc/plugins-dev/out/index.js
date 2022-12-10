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
exports.plugin = exports.toCache = exports.fromCache = void 0;
var babel = __importStar(require("@babel/core"));
var nodePath = __importStar(require("path"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var typescript_1 = __importDefault(require("typescript"));
var configPath = typescript_1["default"].findConfigFile("./", typescript_1["default"].sys.fileExists, "tsconfig.json");
if (!configPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
}
var baseDir = nodePath.dirname(nodePath.resolve(configPath));
var cacheDir = nodePath.join(baseDir, ".cache/effect");
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}
var registry = typescript_1["default"].createDocumentRegistry();
var files = new Set();
var babelConfigPath = nodePath.join(baseDir, "babel.config.js");
var services;
var getScriptVersion = function (fileName) {
    var modified = typescript_1["default"].sys.getModifiedTime(fileName);
    if (modified) {
        return typescript_1["default"].sys.createHash("".concat(fileName).concat(modified.toISOString()));
    }
    else {
        files["delete"](fileName);
    }
    return "none";
};
var init = function () {
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
        getScriptVersion: getScriptVersion,
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
    var services = typescript_1["default"].createLanguageService(servicesHost, registry);
    setTimeout(function () {
        services.getProgram();
    }, 200);
    return services;
};
var getEmit = function (path) {
    files.add(path);
    var program = services.getProgram();
    var source = program.getSourceFile(path);
    var text;
    program.emit(source, function (file, content) {
        if (file.endsWith(".js")) {
            text = content;
        }
    }, void 0, void 0);
    if (!text) {
        throw new Error("Typescript failed emit for file: ".concat(path));
    }
    return text;
};
var cache = new Map();
var fromCache = function (fileName) {
    var current = getScriptVersion(fileName);
    if (cache.has(fileName)) {
        var cached = cache.get(fileName);
        if (cached.hash === current) {
            return cached.content;
        }
    }
    var path = nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".hash"));
    if (fs.existsSync(path)) {
        var hash = fs.readFileSync(path).toString("utf-8");
        if (hash === current) {
            return fs
                .readFileSync(nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".content")))
                .toString("utf-8");
        }
    }
};
exports.fromCache = fromCache;
var toCache = function (fileName, content) {
    var current = getScriptVersion(fileName);
    var path = nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".hash"));
    fs.writeFileSync(path, current);
    fs.writeFileSync(nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".content")), content);
    cache.set(fileName, { hash: current, content: content });
    return content;
};
exports.toCache = toCache;
var plugin = function (_isBrowser, _config, _options) {
    return {
        name: "effect-plugin",
        setup: function (build) {
            if (baseDir) {
                var config = require(path.join(baseDir, "/remix.config.js"));
                var useBabel = false;
                if (babelConfigPath && typescript_1["default"].sys.fileExists(babelConfigPath)) {
                    if (config.future &&
                        "babel" in config.future &&
                        !config.future.babel) {
                        // config found but babel is disabled
                    }
                    else {
                        useBabel = true;
                    }
                }
                if (config.future && config.future.typescript && useBabel) {
                    if (!services) {
                        services = init();
                    }
                    build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                        var cached = (0, exports.fromCache)(args.path);
                        if (cached) {
                            return {
                                contents: cached,
                                loader: "js"
                            };
                        }
                        var result = babel.transformSync(getEmit(args.path), {
                            filename: args.path,
                            configFile: babelConfigPath,
                            sourceMaps: "inline"
                        });
                        if (result === null || result === void 0 ? void 0 : result.code) {
                            return {
                                contents: (0, exports.toCache)(args.path, result === null || result === void 0 ? void 0 : result.code),
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
                        var cached = (0, exports.fromCache)(args.path);
                        if (cached) {
                            return {
                                contents: cached,
                                loader: "js"
                            };
                        }
                        return {
                            contents: (0, exports.toCache)(args.path, getEmit(args.path)),
                            loader: "js"
                        };
                    });
                }
                else if (useBabel) {
                    build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                        var cached = (0, exports.fromCache)(args.path);
                        if (cached) {
                            return {
                                contents: cached,
                                loader: "js"
                            };
                        }
                        var result = babel.transformFileSync(args.path, {
                            configFile: babelConfigPath,
                            sourceMaps: "inline"
                        });
                        if (result === null || result === void 0 ? void 0 : result.code) {
                            return {
                                contents: (0, exports.toCache)(args.path, result === null || result === void 0 ? void 0 : result.code),
                                loader: "js"
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
