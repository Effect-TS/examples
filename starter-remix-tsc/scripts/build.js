const index = require("@remix-run/dev/dist/index.js");

const cli = index.cli;
const argv = process.argv;

process.argv = [...argv, "build"];

cli.run().then(
  () => {
    process.exit(0);
  },
  (error) => {
    // for expected errors we only show the message (if any), no stack trace
    if (error instanceof index.CliError) error = error.message;
    if (error) console.error(error);
    process.exit(1);
  }
);
