require("@remix-run/dev/dist/compiler/compileBrowser").createBrowserCompiler =
  require("./compiler/browser").createBrowserCompiler;
require("@remix-run/dev/dist/compiler/compileBrowser").createServerCompiler =
  require("./compiler/server").createServerCompiler;

const index = require("@remix-run/dev/dist/index.js");
const child = require("child_process");

const cli = index.cli;
const argv = process.argv;

process.env["NODE_ENV"] = "development";
process.argv = [...argv, "build"];

cli.run().then(
  () => {
    const forked = child.exec(
      "cross-env NODE_ENV=development nodemon --require dotenv/config ./server.js --watch ./server.js",
      (exit: any) => {
        if (exit.code !== 0) {
          process.exit(exit.code);
        }
      }
    );

    forked.stdout.pipe(process.stdout);
    forked.stderr.pipe(process.stderr);

    process.argv = [...argv, "watch"];

    cli.run().then(
      () => {
        forked.kill(0);
        process.exit(0);
      },
      (error: any) => {
        forked.kill(1);
        // for expected errors we only show the message (if any), no stack trace
        if (error instanceof index.CliError) error = error.message;
        if (error) console.error(error);
        process.exit(1);
      }
    );
  },
  (error: any) => {
    // for expected errors we only show the message (if any), no stack trace
    if (error instanceof index.CliError) error = error.message;
    if (error) console.error(error);
    process.exit(1);
  }
);

export {};
