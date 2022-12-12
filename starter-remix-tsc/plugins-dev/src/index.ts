if (process.argv[2] === "build") {
  process.argv.pop();
  require("./build");
} else {
  process.argv.pop();
  require("./dev");
}
