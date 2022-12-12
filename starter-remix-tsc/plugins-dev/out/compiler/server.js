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
exports.createServerCompiler = void 0;
var path = __importStar(require("path"));
var esbuild = __importStar(require("esbuild"));
var fse = __importStar(require("fs-extra"));
var node_modules_polyfill_1 = require("@esbuild-plugins/node-modules-polyfill");
var loaders_1 = require("@remix-run/dev/dist/compiler/loaders");
var cssFilePlugin_1 = require("@remix-run/dev/dist/compiler/plugins/cssFilePlugin");
var deprecatedRemixPackagePlugin_1 = require("@remix-run/dev/dist/compiler/plugins/deprecatedRemixPackagePlugin");
var emptyModulesPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/emptyModulesPlugin");
var mdx_1 = require("@remix-run/dev/dist/compiler/plugins/mdx");
var serverAssetsManifestPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/serverAssetsManifestPlugin");
var serverBareModulesPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/serverBareModulesPlugin");
var serverEntryModulePlugin_1 = require("@remix-run/dev/dist/compiler/plugins/serverEntryModulePlugin");
var serverRouteModulesPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/serverRouteModulesPlugin");
var urlImportsPlugin_1 = require("@remix-run/dev/dist/compiler/plugins/urlImportsPlugin");
var effect_1 = require("../plugins/effect");
var createEsbuildConfig = function (config, assetsManifestChannel, options) {
    var _a;
    var stdin;
    var entryPoints;
    if (config.serverEntryPoint) {
        entryPoints = [config.serverEntryPoint];
    }
    else {
        stdin = {
            contents: config.serverBuildTargetEntryModule,
            resolveDir: config.rootDirectory,
            loader: "ts"
        };
    }
    var isCloudflareRuntime = ["cloudflare-pages", "cloudflare-workers"].includes((_a = config.serverBuildTarget) !== null && _a !== void 0 ? _a : "");
    var isDenoRuntime = config.serverBuildTarget === "deno";
    var plugins = [
        (0, deprecatedRemixPackagePlugin_1.deprecatedRemixPackagePlugin)(options.onWarning),
        (0, cssFilePlugin_1.cssFilePlugin)(options),
        (0, urlImportsPlugin_1.urlImportsPlugin)(),
        (0, mdx_1.mdxPlugin)(config),
        (0, emptyModulesPlugin_1.emptyModulesPlugin)(config, /\.client(\.[jt]sx?)?$/),
        (0, serverRouteModulesPlugin_1.serverRouteModulesPlugin)(config),
        (0, serverEntryModulePlugin_1.serverEntryModulePlugin)(config),
        (0, serverAssetsManifestPlugin_1.serverAssetsManifestPlugin)(assetsManifestChannel.read()),
        (0, serverBareModulesPlugin_1.serverBareModulesPlugin)(config, options.onWarning),
    ];
    if (config.serverPlatform !== "node") {
        plugins.unshift((0, node_modules_polyfill_1.NodeModulesPolyfillPlugin)());
    }
    plugins.unshift((0, effect_1.effectPlugin)());
    return {
        absWorkingDir: config.rootDirectory,
        stdin: stdin,
        entryPoints: entryPoints,
        outfile: config.serverBuildPath,
        conditions: isCloudflareRuntime ? ["worker"] : isDenoRuntime ? ["deno", "worker"] : undefined,
        platform: config.serverPlatform,
        format: config.serverModuleFormat,
        treeShaking: true,
        // The type of dead code elimination we want to do depends on the
        // minify syntax property: https://github.com/evanw/esbuild/issues/672#issuecomment-1029682369
        // Dev builds are leaving code that should be optimized away in the
        // bundle causing server / testing code to be shipped to the browser.
        // These are properly optimized away in prod builds today, and this
        // PR makes dev mode behave closer to production in terms of dead
        // code elimination / tree shaking is concerned.
        minifySyntax: true,
        minify: options.mode === "production" && isCloudflareRuntime,
        mainFields: isCloudflareRuntime
            ? ["browser", "module", "main"]
            : config.serverModuleFormat === "esm"
                ? ["module", "main"]
                : ["main", "module"],
        target: options.target,
        loader: loaders_1.loaders,
        bundle: true,
        logLevel: "silent",
        // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
        // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
        // behavior can only be avoided by creating an empty tsconfig file in the root directory.
        tsconfig: config.tsconfigPath,
        sourcemap: options.sourcemap,
        // The server build needs to know how to generate asset URLs for imports
        // of CSS and other files.
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
function writeServerBuildResult(config, outputFiles) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, outputFiles_1, file, filename, escapedFilename, pattern, contents, contents, assetPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fse.ensureDir(path.dirname(config.serverBuildPath))];
                case 1:
                    _a.sent();
                    _i = 0, outputFiles_1 = outputFiles;
                    _a.label = 2;
                case 2:
                    if (!(_i < outputFiles_1.length)) return [3 /*break*/, 10];
                    file = outputFiles_1[_i];
                    if (!file.path.endsWith(".js")) return [3 /*break*/, 4];
                    filename = file.path.substring(file.path.lastIndexOf(path.sep) + 1);
                    escapedFilename = filename.replace(/\./g, "\\.");
                    pattern = "(//# sourceMappingURL=)(.*)".concat(escapedFilename);
                    contents = Buffer.from(file.contents).toString("utf-8");
                    contents = contents.replace(new RegExp(pattern), "$1".concat(filename));
                    return [4 /*yield*/, fse.writeFile(file.path, contents)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 4:
                    if (!file.path.endsWith(".map")) return [3 /*break*/, 6];
                    contents = Buffer.from(file.contents).toString("utf-8");
                    contents = contents.replace(/"route:/gm, '"');
                    return [4 /*yield*/, fse.writeFile(file.path, contents)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 6:
                    assetPath = path.join(config.assetsBuildDirectory, file.path.replace(path.dirname(config.serverBuildPath), ""));
                    return [4 /*yield*/, fse.ensureDir(path.dirname(assetPath))];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, fse.writeFile(assetPath, file.contents)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 2];
                case 10: return [2 /*return*/];
            }
        });
    });
}
var createServerCompiler = function (remixConfig, options) {
    var compile = function (manifestChannel) { return __awaiter(void 0, void 0, void 0, function () {
        var esbuildConfig, outputFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    esbuildConfig = createEsbuildConfig(remixConfig, manifestChannel, options);
                    return [4 /*yield*/, esbuild.build(__assign(__assign({}, esbuildConfig), { write: false }))];
                case 1:
                    outputFiles = (_a.sent()).outputFiles;
                    return [4 /*yield*/, writeServerBuildResult(remixConfig, outputFiles)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return {
        compile: compile,
        dispose: function () { return undefined; }
    };
};
exports.createServerCompiler = createServerCompiler;
