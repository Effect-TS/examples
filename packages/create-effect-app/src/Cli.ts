import * as Args from "@effect/cli/Args"
import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import * as Prompt from "@effect/cli/Prompt"
import * as FileSystem from "@effect/platform/FileSystem"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import type { TemplateOptions } from "./Domain.js"
import { GitHub } from "./GitHub.js"
import * as InternalVersion from "./internal/version.js"
import { validateProjectName } from "./Utils.js"

const projectName = Prompt.text({
  message: "What is your project named?",
  default: "effect-app",
  validate: (name) =>
    Option.match(validateProjectName(name), {
      onNone: () => Effect.succeed(name),
      onSome: Effect.fail
    })
})

const projectType = Prompt.select<"basic" | "monorepo" | "cli">({
  message: "What type of project should be created?",
  choices: [
    {
      title: "Basic Package",
      value: "basic",
      description: "A project containing a single package"
    },
    {
      title: "Multi Package",
      value: "monorepo",
      description: "A project containing multiple packages or applications"
    },
    {
      title: "CLI Application",
      value: "cli",
      description: "A project containing a CLI application"
    }
  ]
})

const prompt: Prompt.Prompt<TemplateOptions> = Prompt.all({
  projectName,
  projectType
})

const example = Options.text("example").pipe(
  Options.withAlias("e"),
  Options.withDescription(
    "The name of an official Effect example to use to bootstrap the application"
  ),
  Options.optional
)

const directory = Args.directory({
  name: "project-directory",
  exists: "no"
}).pipe(
  Args.withDefault("."),
  Args.withDescription("The directory to output the Effect application code into")
)

const command = Command.make("create-effect-app", { example, directory }).pipe(
  Command.withDescription("Create an Effect application from an example or a template repository"),
  Command.withHandler(({ directory, example }) =>
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem
      yield* fs.makeDirectory(directory)
      return yield* Option.match(example, {
        onNone: () => Effect.orDie(Effect.asVoid(prompt)),
        onSome: (example) => createExample(directory, example)
      })
    })
  ),
  Command.provide(GitHub.Live)
)

export const cli = Command.run(command, {
  name: "Create Effect App",
  version: `v${InternalVersion.moduleVersion}`
})

function createExample(directory: string, example: string) {
  return Effect.gen(function*() {
    // TODO: logging
    yield* GitHub.downloadExample(directory, example)
  })
}

function createTemplate(directory: string) {
  return Effect.gen(function*() {
    // TODO: logging
    const options = yield* prompt
    yield* GitHub.downloadTemplate(directory, options)
  })
}

// packages/*/package.json
// tsconfig.base.json
// tsconfig.build.json
// tsconfig.json
// vitest.shared.ts
