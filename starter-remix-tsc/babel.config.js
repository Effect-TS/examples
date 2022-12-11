module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        loose: true,
        modules: false,
      },
    ],
    ["@babel/preset-typescript", {}],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: ["babel-plugin-annotate-pure-calls"],
};
