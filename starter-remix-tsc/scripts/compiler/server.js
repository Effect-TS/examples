/**
 * @remix-run/dev v1.8.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

var path = require("path");
var esbuild = require("esbuild");
var fse = require("fs-extra");
var nodeModulesPolyfill = require("@esbuild-plugins/node-modules-polyfill");
var loaders = require("@remix-run/dev/dist/compiler/loaders.js");
var cssFilePlugin = require("@remix-run/dev/dist/compiler/plugins/cssFilePlugin.js");
var deprecatedRemixPackagePlugin = require("@remix-run/dev/dist/compiler/plugins/deprecatedRemixPackagePlugin.js");
var emptyModulesPlugin = require("@remix-run/dev/dist/compiler/plugins/emptyModulesPlugin.js");
var mdx = require("@remix-run/dev/dist/compiler/plugins/mdx.js");
var serverAssetsManifestPlugin = require("@remix-run/dev/dist/compiler/plugins/serverAssetsManifestPlugin.js");
var serverBareModulesPlugin = require("@remix-run/dev/dist/compiler/plugins/serverBareModulesPlugin.js");
var serverEntryModulePlugin = require("@remix-run/dev/dist/compiler/plugins/serverEntryModulePlugin.js");
var serverRouteModulesPlugin = require("@remix-run/dev/dist/compiler/plugins/serverRouteModulesPlugin.js");
var urlImportsPlugin = require("@remix-run/dev/dist/compiler/plugins/urlImportsPlugin.js");
var effectPlugin = require("@effect/remix-plugin");

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== "default") {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: function () {
                  return e[k];
                },
              }
        );
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/ _interopNamespace(path);
var esbuild__namespace = /*#__PURE__*/ _interopNamespace(esbuild);
var fse__namespace = /*#__PURE__*/ _interopNamespace(fse);

const createEsbuildConfig = (config, assetsManifestChannel, options) => {
  let stdin;
  let entryPoints;
  if (config.serverEntryPoint) {
    entryPoints = [config.serverEntryPoint];
  } else {
    stdin = {
      contents: config.serverBuildTargetEntryModule,
      resolveDir: config.rootDirectory,
      loader: "ts",
    };
  }
  let isCloudflareRuntime = ["cloudflare-pages", "cloudflare-workers"].includes(
    config.serverBuildTarget ?? ""
  );
  let isDenoRuntime = config.serverBuildTarget === "deno";
  let plugins = [
    deprecatedRemixPackagePlugin.deprecatedRemixPackagePlugin(options.onWarning),
    cssFilePlugin.cssFilePlugin(options),
    urlImportsPlugin.urlImportsPlugin(),
    mdx.mdxPlugin(config),
    emptyModulesPlugin.emptyModulesPlugin(config, /\.client(\.[jt]sx?)?$/),
    serverRouteModulesPlugin.serverRouteModulesPlugin(config),
    serverEntryModulePlugin.serverEntryModulePlugin(config),
    serverAssetsManifestPlugin.serverAssetsManifestPlugin(assetsManifestChannel.read()),
    serverBareModulesPlugin.serverBareModulesPlugin(config, options.onWarning),
  ];
  if (config.serverPlatform !== "node") {
    plugins.unshift(nodeModulesPolyfill.NodeModulesPolyfillPlugin());
  }
  plugins.unshift(effectPlugin.plugin(false, config, options));
  return {
    absWorkingDir: config.rootDirectory,
    stdin,
    entryPoints,
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
    loader: loaders.loaders,
    bundle: true,
    logLevel: "silent",
    // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
    // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
    // behavior can only be avoided by creating an empty tsconfig file in the root directory.
    tsconfig: config.tsconfigPath,
    sourcemap: options.sourcemap,
    // use linked (true) to fix up .map file
    // The server build needs to know how to generate asset URLs for imports
    // of CSS and other files.
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(config.devServerPort),
    },
    jsx: "automatic",
    jsxDev: options.mode !== "production",
    plugins,
  };
};
async function writeServerBuildResult(config, outputFiles) {
  await fse__namespace.ensureDir(path__namespace.dirname(config.serverBuildPath));
  for (let file of outputFiles) {
    if (file.path.endsWith(".js")) {
      // fix sourceMappingURL to be relative to current path instead of /build
      let filename = file.path.substring(file.path.lastIndexOf(path__namespace.sep) + 1);
      let escapedFilename = filename.replace(/\./g, "\\.");
      let pattern = `(//# sourceMappingURL=)(.*)${escapedFilename}`;
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(new RegExp(pattern), `$1${filename}`);
      await fse__namespace.writeFile(file.path, contents);
    } else if (file.path.endsWith(".map")) {
      // remove route: prefix from source filenames so breakpoints work
      let contents = Buffer.from(file.contents).toString("utf-8");
      contents = contents.replace(/"route:/gm, '"');
      await fse__namespace.writeFile(file.path, contents);
    } else {
      let assetPath = path__namespace.join(
        config.assetsBuildDirectory,
        file.path.replace(path__namespace.dirname(config.serverBuildPath), "")
      );
      await fse__namespace.ensureDir(path__namespace.dirname(assetPath));
      await fse__namespace.writeFile(assetPath, file.contents);
    }
  }
}
const createServerCompiler = (remixConfig, options) => {
  let compile = async (manifestChannel) => {
    let esbuildConfig = createEsbuildConfig(remixConfig, manifestChannel, options);
    let { outputFiles } = await esbuild__namespace.build({
      ...esbuildConfig,
      write: false,
    });
    await writeServerBuildResult(remixConfig, outputFiles);
  };
  return {
    compile,
    dispose: () => undefined,
  };
};

exports.createServerCompiler = createServerCompiler;
