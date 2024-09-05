import * as Args from "@effect/cli/Args"
import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import * as Prompt from "@effect/cli/Prompt"
import * as FileSystem from "@effect/platform/FileSystem"
import * as Path from "@effect/platform/Path"
import * as Ansi from "@effect/printer-ansi/Ansi"
import * as AnsiDoc from "@effect/printer-ansi/AnsiDoc"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Glob from "fast-glob"
import type { ProjectType, TemplateOptions } from "./Domain.js"
import { GitHub } from "./GitHub.js"
import * as InternalExamples from "./internal/examples.js"
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

const projectType = Prompt.select<ProjectType>({
  message: "What project template should be used?",
  choices: [
    {
      title: "Basic",
      value: "basic",
      description: "A project containing a single package"
    },
    {
      title: "Monorepo",
      value: "monorepo",
      description: "A project containing multiple packages"
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

const example = Options.choice("example", InternalExamples.examples).pipe(
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
      const path = yield* Path.Path
      const absolutePath = path.resolve(directory)
      yield* Effect.logInfo(AnsiDoc.hsep([
        AnsiDoc.text("Creating a new Effect application in"),
        AnsiDoc.text(absolutePath).pipe(AnsiDoc.annotate(Ansi.green))
      ]))
      return yield* Option.match(example, {
        onNone: () => createTemplate(absolutePath),
        onSome: (example) => createExample(absolutePath, example)
      })
    })
  )
)

export const cli = Command.run(command, {
  name: "Create Effect App",
  version: `v${InternalVersion.moduleVersion}`
})

function createExample(directory: string, example: string) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Create the project directory
    yield* fs.makeDirectory(directory)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Initializing example project:"),
      AnsiDoc.text(example).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Download the example project from GitHub
    yield* GitHub.downloadExample(directory, example)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Success!").pipe(AnsiDoc.annotate(Ansi.green)),
      AnsiDoc.text(`Effect example application was initialized in ${directory}`)
    ]))
  })
}

function createTemplate(directory: string) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Prompt user for options
    const options = yield* Prompt.run(prompt)

    // Create the project directory
    yield* fs.makeDirectory(directory)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Initializing project with template:"),
      AnsiDoc.text(options.projectType).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Download the template project from GitHub
    yield* GitHub.downloadTemplate(directory, options)

    // Replace the template project name with the user-provided project name
    yield* replaceProjectName(directory, options)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Success!").pipe(AnsiDoc.annotate(Ansi.green)),
      AnsiDoc.text(`Effect template project was initialized in ${directory}`)
    ]))
  })
}

function replaceProjectName(directory: string, options: TemplateOptions) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    switch (options.projectType) {
      case "basic":
      case "cli": {
        return yield* Effect.forEach(
          ["package.json", "vitest.config.ts"],
          (file) => {
            const filePath = path.join(directory, file)
            return fs.readFileString(filePath).pipe(
              Effect.map((contents) => contents.replaceAll(`@template/${options.projectType}`, options.projectName)),
              Effect.flatMap((contents) => fs.writeFileString(filePath, contents))
            )
          },
          { concurrency: 8, discard: true }
        )
      }
      case "monorepo": {
        return yield* Effect.forEach(
          Glob.sync([
            "packages/*/package.json",
            "tsconfig.base.json",
            "tsconfig.build.json",
            "tsconfig.json",
            "vitest.shared.ts"
          ]),
          (file) => {
            const filePath = path.join(directory, file)
            return fs.readFileString(filePath).pipe(
              Effect.map((contents) => contents.replaceAll(`@template`, options.projectName)),
              Effect.flatMap((contents) => fs.writeFileString(filePath, contents))
            )
          },
          { concurrency: 8, discard: true }
        )
      }
    }
  })
}
