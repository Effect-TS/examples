"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
require("@remix-run/dev/dist/compiler/compileBrowser").createBrowserCompiler =
    require("./compiler/browser").createBrowserCompiler;
require("@remix-run/dev/dist/compiler/compileBrowser").createServerCompiler =
    require("./compiler/server").createServerCompiler;
var index = require("@remix-run/dev/dist/index.js");
var cli = index.cli;
var argv = process.argv;
process.env["NODE_ENV"] = "production";
process.argv = __spreadArray(__spreadArray([], argv, true), ["build"], false);
cli.run().then(function () {
    process.exit(0);
}, function (error) {
    // for expected errors we only show the message (if any), no stack trace
    if (error instanceof index.CliError)
        error = error.message;
    if (error)
        console.error(error);
    process.exit(1);
});
