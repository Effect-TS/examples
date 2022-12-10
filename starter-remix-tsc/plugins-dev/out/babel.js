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
var babel = __importStar(require("@babel/core"));
var plugin = function () {
    return {
        name: "babel-plugin",
        setup: function (build) {
            build.onLoad({ filter: /(.ts|.tsx|.tsx?browser)$/ }, function (args) {
                var result = babel.transformFileSync(args.path, {
                    sourceMaps: "inline"
                });
                if (result === null || result === void 0 ? void 0 : result.code) {
                    return {
                        contents: result === null || result === void 0 ? void 0 : result.code,
                        loader: args.path.endsWith("tsx") ? "jsx" : "js"
                    };
                }
                throw new Error("babel didnt produce a result for file: ".concat(args.path));
            });
        }
    };
};
exports.plugin = plugin;
