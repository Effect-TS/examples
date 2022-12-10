const index = require("@remix-run/dev/dist/index.js");
const child = require("child_process");

const cli = index.cli;
const argv = process.argv;

process.argv = [...argv, "build"];

cli.run().then(
  () => {
    const forked = child.exec(
      "cross-env NODE_ENV=development nodemon --require dotenv/config ./server.js --watch ./server.js",
      (exit) => {
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
      (error) => {
        forked.kill(1);
        // for expected errors we only show the message (if any), no stack trace
        if (error instanceof index.CliError) error = error.message;
        if (error) console.error(error);
        process.exit(1);
      }
    );
  },
  (error) => {
    // for expected errors we only show the message (if any), no stack trace
    if (error instanceof index.CliError) error = error.message;
    if (error) console.error(error);
    process.exit(1);
  }
);
