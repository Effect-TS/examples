import * as Fs from "node:fs"

const template = Fs.readFileSync("./scripts/examples.template.txt").toString("utf8")
const examples = Fs.readdirSync("./examples", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

Fs.writeFileSync(
  "./packages/create-effect-app/src/internal/examples.ts",
  template.replace("EXAMPLES", JSON.stringify(examples))
)
