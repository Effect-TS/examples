module.exports = {
  presets: [
    ["@babel/preset-typescript", {}],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: ["babel-plugin-annotate-pure-calls"],
};
