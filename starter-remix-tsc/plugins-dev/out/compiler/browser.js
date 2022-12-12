"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.createBrowserCompiler = void 0;
var path = __importStar(require("path"));
var module_1 = require("module");
var esbuild = __importStar(require("esbuild"));
var node_modules_polyfill_1 = require("@esbuild-plugins/node-modules-polyfill");
var assets_1 = require("@remix-run/dev/dist/compiler/assets");
var dependencies_1 = require("@remix-run/dev/dist/compiler/dependencies");
var loaders_1 = require("@remix-run/dev/dist/compiler/loaders");
var browserRouteModulesPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/browserRouteModulesPlugin");
var cssFilePlugin_1 = require("@remix-run/dev/dist/compiler/plugins/cssFilePlugin");
var deprecatedRemixPackagePlugin_1 = require("@remix-run/dev/dist/compiler/plugins/deprecatedRemixPackagePlugin");
var emptyModulesPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/emptyModulesPlugin");
var mdx_1 = require("@remix-run/dev/dist/compiler/plugins/mdx");
var urlImportsPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/urlImportsPlugin");
var fs_1 = require("@remix-run/dev/dist/compiler/utils/fs");
var effect_1 = require("../plugins/effect");
var getExternals = function (remixConfig) {
    // For the browser build, exclude node built-ins that don't have a
    // browser-safe alternative installed in node_modules. Nothing should
    // *actually* be external in the browser build (we want to bundle all deps) so
    // this is really just making sure we don't accidentally have any dependencies
    // on node built-ins in browser bundles.
    var dependencies = Object.keys((0, dependencies_1.getAppDependencies)(remixConfig));
    var fakeBuiltins = module_1.builtinModules.filter(function (mod) { return dependencies.includes(mod); });
    if (fakeBuiltins.length > 0) {
        throw new Error("It appears you're using a module that is built in to node, but you installed it as a dependency which could cause problems. Please remove ".concat(fakeBuiltins.join(", "), " before continuing."));
    }
    return module_1.builtinModules.filter(function (mod) { return !dependencies.includes(mod); });
};
var writeAssetsManifest = function (config, assetsManifest) { return __awaiter(void 0, void 0, void 0, function () {
    var filename;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filename = "manifest-".concat(assetsManifest.version.toUpperCase(), ".js");
                assetsManifest.url = config.publicPath + filename;
                return [4 /*yield*/, (0, fs_1.writeFileSafe)(path.join(config.assetsBuildDirectory, filename), "window.__remixManifest=".concat(JSON.stringify(assetsManifest), ";"))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var createEsbuildConfig = function (config, options) {
    var entryPoints = {
        "entry.client": path.resolve(config.appDirectory, config.entryClientFile)
    };
    for (var _i = 0, _a = Object.keys(config.routes); _i < _a.length; _i++) {
        var id = _a[_i];
        // All route entry points are virtual modules that will be loaded by the
        // browserEntryPointsPlugin. This allows us to tree-shake server-only code
        // that we don't want to run in the browser (i.e. action & loader).
        entryPoints[id] = config.routes[id].file + "?browser";
    }
    var plugins = [
        (0, effect_1.effectPlugin)(),
        (0, deprecatedRemixPackagePlugin_1.deprecatedRemixPackagePlugin)(options.onWarning),
        (0, cssFilePlugin_1.cssFilePlugin)(options),
        (0, urlImportsPlugin_1.urlImportsPlugin)(),
        (0, mdx_1.mdxPlugin)(config),
        (0, browserRouteModulesPlugin_1.browserRouteModulesPlugin)(config, /\?browser$/),
        (0, emptyModulesPlugin_1.emptyModulesPlugin)(config, /\.server(\.[jt]sx?)?$/),
        (0, node_modules_polyfill_1.NodeModulesPolyfillPlugin)(),
    ];
    return {
        entryPoints: entryPoints,
        outdir: config.assetsBuildDirectory,
        platform: "browser",
        format: "esm",
        external: getExternals(config),
        loader: loaders_1.loaders,
        bundle: true,
        logLevel: "silent",
        splitting: true,
        sourcemap: options.sourcemap,
        // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
        // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
        // behavior can only be avoided by creating an empty tsconfig file in the root directory.
        tsconfig: config.tsconfigPath,
        mainFields: ["browser", "module", "main"],
        treeShaking: true,
        minify: options.mode === "production",
        entryNames: "[dir]/[name]-[hash]",
        chunkNames: "_shared/[name]-[hash]",
        assetNames: "_assets/[name]-[hash]",
        publicPath: config.publicPath,
        define: {
            "process.env.NODE_ENV": JSON.stringify(options.mode),
            "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(config.devServerPort)
        },
        jsx: "automatic",
        jsxDev: options.mode !== "production",
        plugins: plugins
    };
};
var createBrowserCompiler = function (remixConfig, options) {
    var compiler;
    var esbuildConfig = createEsbuildConfig(remixConfig, options);
    var compile = function (manifestChannel) { return __awaiter(void 0, void 0, void 0, function () {
        var metafile, manifest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(compiler === undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, esbuild.build(__assign(__assign({}, esbuildConfig), { metafile: true, incremental: true }))];
                case 1:
                    compiler = _a.sent();
                    metafile = compiler.metafile;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, compiler.rebuild()];
                case 3:
                    metafile = (_a.sent()).metafile;
                    _a.label = 4;
                case 4: return [4 /*yield*/, (0, assets_1.createAssetsManifest)(remixConfig, metafile)];
                case 5:
                    manifest = _a.sent();
                    manifestChannel.write(manifest);
                    return [4 /*yield*/, writeAssetsManifest(remixConfig, manifest)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        compile: compile,
        dispose: function () { return compiler === null || compiler === void 0 ? void 0 : compiler.rebuild.dispose(); }
    };
};
exports.createBrowserCompiler = createBrowserCompiler;
