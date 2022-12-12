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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.effectPlugin = exports.getCompiled = exports.toCache = exports.fromCache = void 0;
var pluginutils_1 = require("@rollup/pluginutils");
var fs_1 = __importDefault(require("fs"));
var nodePath = __importStar(require("path"));
var typescript_1 = __importDefault(require("typescript"));
var plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
var configPath = typescript_1["default"].findConfigFile("./", typescript_1["default"].sys.fileExists, "tsconfig.json");
if (!configPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
}
var baseDir = nodePath.dirname(nodePath.resolve(configPath));
var cacheDir = nodePath.join(baseDir, ".cache/effect");
if (!fs_1["default"].existsSync(cacheDir)) {
    fs_1["default"].mkdirSync(cacheDir, { recursive: true });
}
var registry = typescript_1["default"].createDocumentRegistry();
var files = new Set();
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
        if (file.endsWith(".js") || file.endsWith(".jsx")) {
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
    if (fs_1["default"].existsSync(path)) {
        var hash = fs_1["default"].readFileSync(path).toString("utf-8");
        if (hash === current) {
            return fs_1["default"]
                .readFileSync(nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".content")))
                .toString("utf-8");
        }
    }
};
exports.fromCache = fromCache;
var toCache = function (fileName, content) {
    var current = getScriptVersion(fileName);
    var path = nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".hash"));
    fs_1["default"].writeFileSync(path, current);
    fs_1["default"].writeFileSync(nodePath.join(cacheDir, "".concat(typescript_1["default"].sys.createHash(fileName), ".content")), content);
    cache.set(fileName, { hash: current, content: content });
    return content;
};
exports.toCache = toCache;
var getCompiled = function (path) {
    var cached = (0, exports.fromCache)(path);
    if (cached) {
        return {
            code: cached
        };
    }
    var syntactic = services.getSyntacticDiagnostics(path);
    if (syntactic.length > 0) {
        throw new Error(syntactic
            .map(function (_) { return typescript_1["default"].flattenDiagnosticMessageText(_.messageText, "\n"); })
            .join("\n"));
    }
    var semantic = services.getSemanticDiagnostics(path);
    services.cleanupSemanticCache();
    if (semantic.length > 0) {
        throw new Error(semantic
            .map(function (_) { return typescript_1["default"].flattenDiagnosticMessageText(_.messageText, "\n"); })
            .join("\n"));
    }
    var code = (0, exports.toCache)(path, getEmit(path));
    return {
        code: code
    };
};
exports.getCompiled = getCompiled;
function effectPlugin(options) {
    var filter = (0, pluginutils_1.createFilter)(options === null || options === void 0 ? void 0 : options.include, options === null || options === void 0 ? void 0 : options.exclude);
    if (!services) {
        services = init();
    }
    var plugin = {
        name: "vite:typescript-effect",
        enforce: "pre",
        configureServer: function (dev) {
            dev.watcher.on("all", function (event, path) {
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
                                files["delete"](path);
                                break;
                            }
                        }
                    }
                }
            });
        },
        watchChange: function (path, change) {
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
                            files["delete"](path);
                            break;
                        }
                    }
                }
            }
        },
        transform: function (_, path) {
            if (/\.tsx?/.test(path) && filter(path)) {
                return (0, exports.getCompiled)(path);
            }
        }
    };
    return __spreadArray([plugin], (0, plugin_react_1["default"])(options), true);
}
exports.effectPlugin = effectPlugin;
