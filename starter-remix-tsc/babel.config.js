module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "> 5%", modules: false }],
    ["@babel/preset-typescript", {}],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: ["babel-plugin-annotate-pure-calls"],
};
