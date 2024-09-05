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
import type { TemplateType } from "./Domain.js"
import { GitHub } from "./GitHub.js"
import * as InternalExamples from "./internal/examples.js"
import * as InternalVersion from "./internal/version.js"
import { validateProjectName } from "./Utils.js"

const example = Options.choice("example", InternalExamples.examples).pipe(
  Options.withAlias("e"),
  Options.withDescription(
    "The name of an official Effect example to use to bootstrap the application"
  ),
  Options.optional
)

const projectName = Args.directory({
  name: "project-name",
  exists: "no"
}).pipe(
  Args.withDescription("The directory to output the Effect application code into"),
  Args.optional
)

const command = Command.make("create-effect-app", { example, projectName }).pipe(
  Command.withDescription("Create an Effect application from an example or a template repository"),
  Command.withHandler(({ example, projectName }) =>
    Effect.gen(function*() {
      const projectPath = yield* resolveProjectPath(projectName)
      yield* Effect.logInfo(AnsiDoc.hsep([
        AnsiDoc.text("Creating a new Effect application in"),
        AnsiDoc.text(projectPath).pipe(AnsiDoc.annotate(Ansi.green))
      ]))
      return yield* Option.match(example, {
        onNone: () => createTemplate(projectPath),
        onSome: (example) => createExample(projectPath, example)
      })
    })
  )
)

export const cli = Command.run(command, {
  name: "Create Effect App",
  version: `v${InternalVersion.moduleVersion}`
})

function resolveProjectPath(projectName: Option.Option<string>) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    return yield* Option.match(projectName, {
      onSome: (name) => Effect.succeed(path.resolve(name)),
      onNone: () =>
        Prompt.text({
          message: "What is your project named?",
          default: "effect-app",
          validate: (name) =>
            Option.match(validateProjectName(name), {
              onNone: () =>
                Effect.if(Effect.orDie(fs.exists(path.resolve(name))), {
                  onTrue: () => Effect.fail(`The path ${path.resolve(name)} already exists`),
                  onFalse: () => Effect.succeed(name)
                }),
              onSome: Effect.fail
            })
        })
    })
  })
}

function createExample(projectPath: string, example: string) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Create the project path
    yield* fs.makeDirectory(projectPath)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Initializing example project:"),
      AnsiDoc.text(example).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Download the example project from GitHub
    yield* GitHub.downloadExample(projectPath, example)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Success!").pipe(AnsiDoc.annotate(Ansi.green)),
      AnsiDoc.text(`Effect example application was initialized in ${projectPath}`)
    ]))
  })
}

function createTemplate(projectPath: string) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    // Prompt user for the project template to use
    const template = yield* Prompt.select<TemplateType>({
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

    // Create the project directory
    yield* fs.makeDirectory(projectPath)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Initializing project with template:"),
      AnsiDoc.text(template).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Download the template project from GitHub
    yield* GitHub.downloadTemplate(projectPath, template)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Success!").pipe(AnsiDoc.annotate(Ansi.green)),
      AnsiDoc.text(`Effect template project was initialized in ${projectPath}`)
    ]))
  })
}
