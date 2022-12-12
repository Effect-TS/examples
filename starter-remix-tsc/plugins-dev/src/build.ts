require("@remix-run/dev/dist/compiler/compileBrowser").createBrowserCompiler =
  require("./compiler/browser").createBrowserCompiler;

require("@remix-run/dev/dist/compiler/compileBrowser").createServerCompiler =
  require("./compiler/server").createServerCompiler;

const index = require("@remix-run/dev/dist/index.js");

const cli = index.cli;
const argv = process.argv;

process.env["NODE_ENV"] = "production";
process.argv = [...argv, "build"];

cli.run().then(
  () => {
    process.exit(0);
  },
  (error: any) => {
    // for expected errors we only show the message (if any), no stack trace
    if (error instanceof index.CliError) error = error.message;
    if (error) console.error(error);
    process.exit(1);
  }
);

export {};
