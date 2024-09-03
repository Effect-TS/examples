import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import * as InternalVersion from "./internal/version.js"

const example = Options.text("example").pipe(
  Options.withAlias("e"),
  Options.withDescription(
    "The name of an official Effect example to use to bootstrap the application"
  )
)

const outDir = Options.directory("out-dir", { exists: "no" }).pipe(
  Options.withAlias("o"),
  Options.withDefault("."),
  Options.withDescription("The directory to output the Effect application code into")
)

const command = Command.make("create-effect-app", { example, outDir })

export const cli = Command.run(command, {
  name: "Create Effect App",
  version: `v${InternalVersion.moduleVersion}`
})
