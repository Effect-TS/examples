import * as Args from "@effect/cli/Args"
import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import * as Prompt from "@effect/cli/Prompt"
import * as FileSystem from "@effect/platform/FileSystem"
import * as Path from "@effect/platform/Path"
import * as Ansi from "@effect/printer-ansi/Ansi"
import * as AnsiDoc from "@effect/printer-ansi/AnsiDoc"
import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Match from "effect/Match"
import * as Option from "effect/Option"
import * as Yaml from "yaml"
import { ProjectType } from "./Domain.js"
import { GitHub } from "./GitHub.js"
import type { Example } from "./internal/examples.js"
import { examples } from "./internal/examples.js"
import { type Template, templates } from "./internal/templates.js"
import * as InternalVersion from "./internal/version.js"
import { validateProjectName } from "./Utils.js"

// =============================================================================
// CLI Specification
// =============================================================================

const projectName = Args.directory({ name: "project-name", exists: "no" }).pipe(
  Args.withDescription("The folder to output the Effect application code into"),
  Args.mapEffect(validateProjectName),
  Args.mapEffect((projectName) => Effect.map(Path.Path, (path) => path.resolve(projectName))),
  Args.optional
)

const exampleType = Options.choice("example", examples).pipe(
  Options.withAlias("e"),
  Options.withDescription(
    "The name of an official Effect example to use to bootstrap the application"
  )
)

const templateType = Options.choice("template", templates).pipe(
  Options.withAlias("t"),
  Options.withDescription(
    "The name of an official Effect example to use to bootstrap the application"
  )
)

const withChangesets = Options.boolean("changesets").pipe(
  Options.withDescription("Initialize project with Changesets")
)

const withNixFlake = Options.boolean("flake").pipe(
  Options.withDescription("Initialize project with a Nix flake")
)

const withESLint = Options.boolean("eslint").pipe(
  Options.withDescription("Initialize project with ESLint")
)

const withWorkflows = Options.boolean("workflows").pipe(
  Options.withDescription("Initialize project with Effect's recommended GitHub actions")
)

const projectType: Options.Options<Option.Option<ProjectType>> = Options.all({
  example: exampleType
}).pipe(
  Options.map(ProjectType.Example),
  Options.orElse(
    Options.all({
      template: templateType,
      withChangesets,
      withNixFlake,
      withESLint,
      withWorkflows
    }).pipe(Options.map(ProjectType.Template))
  ),
  Options.optional
)

export interface RawConfig {
  readonly projectName: Option.Option<string>
  readonly projectType: Option.Option<ProjectType>
}

export interface ResolvedConfig {
  readonly projectName: string
  readonly projectType: ProjectType
}

export interface ExampleConfig extends ResolvedConfig {
  readonly projectType: Extract<ProjectType, { _tag: "Example" }>
}

export interface TemplateConfig extends ResolvedConfig {
  readonly projectType: Extract<ProjectType, { _tag: "Template" }>
}

const options = {
  projectName,
  projectType
}

const command = Command.make("create-effect-app", options).pipe(
  Command.withDescription("Create an Effect application from an example or a template repository"),
  Command.withHandler(handleCommand)
)

export const cli = Command.run(command, {
  name: "Create Effect App",
  version: `v${InternalVersion.moduleVersion}`
})

// =============================================================================
// Utilities
// =============================================================================

function handleCommand(config: RawConfig) {
  return Effect.all({
    projectName: resolveProjectName(config),
    projectType: resolveProjectType(config)
  }).pipe(Effect.flatMap(createProject))
}

const createProject = Match.type<ResolvedConfig>().pipe(
  Match.when({ projectType: { _tag: "Example" } }, (config) => createExample(config)),
  Match.when({ projectType: { _tag: "Template" } }, (config) => createTemplate(config)),
  Match.orElseAbsurd
)

function resolveProjectName(config: RawConfig) {
  return Option.match(config.projectName, {
    onSome: Effect.succeed,
    onNone: () =>
      Prompt.text({
        message: "What is your project named?",
        default: "effect-app"
      }).pipe(Effect.flatMap((name) => Path.Path.pipe(Effect.map((path) => path.resolve(name)))))
  })
}

function resolveProjectType(config: RawConfig) {
  return Option.match(config.projectType, {
    onSome: Effect.succeed,
    onNone: () => Prompt.run(getUserInput)
  })
}

/**
 * Examples are simply cloned as is from GitHub
 */
function createExample(config: ExampleConfig) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Creating a new Effect application in: "),
      AnsiDoc.text(config.projectName).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Create the project path
    yield* fs.makeDirectory(config.projectName, { recursive: true })

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Initializing example project:"),
      AnsiDoc.text(config.projectType.example).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Download the example project from GitHub
    yield* GitHub.downloadExample(config)

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Success!").pipe(AnsiDoc.annotate(Ansi.green)),
      AnsiDoc.text("Effect example application was initialized in: "),
      AnsiDoc.text(config.projectName).pipe(AnsiDoc.annotate(Ansi.cyan))
    ]))
  })
}

/**
 * Templates are cloned from GitHub and then resolved against the preferences
 * specified by the user
 */
function createTemplate(config: TemplateConfig) {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Creating a new Effect project in"),
      AnsiDoc.text(config.projectName).pipe(AnsiDoc.annotate(Ansi.green))
    ]))

    // Create the project directory
    yield* fs.makeDirectory(config.projectName, { recursive: true })

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Initializing project with template:"),
      AnsiDoc.text(config.projectType.template).pipe(AnsiDoc.annotate(Ansi.magenta))
    ]))

    // Download the template project from GitHub
    yield* GitHub.downloadTemplate(config)

    const packageJson = yield* fs.readFileString(path.join(config.projectName, "package.json")).pipe(
      Effect.map((json) => JSON.parse(json))
    )

    // Handle user preferences for changesets
    if (!config.projectType.withChangesets) {
      // Remove the .changesets directory
      yield* fs.remove(path.join(config.projectName, ".changeset"), {
        recursive: true
      })
      // Remove patches for changesets
      const patches = yield* fs.readDirectory(path.join(config.projectName, "patches")).pipe(
        Effect.map(Array.filter((file) => file.includes("changeset")))
      )
      yield* Effect.forEach(patches, (patch) => fs.remove(path.join(config.projectName, "patches", patch)))
      // Remove patched dependencies for changesets
      const depsToRemove = Array.filter(
        Object.keys(packageJson["pnpm"]["patchedDependencies"]),
        (key) => key.includes("changeset")
      )
      for (const patch of depsToRemove) {
        delete packageJson["pnpm"]["patchedDependencies"][patch]
      }
      // Remove scripts for changesets
      const scriptsToRemove = Array.filter(
        Object.keys(packageJson["scripts"]),
        (key) => key.includes("changeset")
      )
      for (const script of scriptsToRemove) {
        delete packageJson["scripts"][script]
      }
      // Remove packages for changesets
      const pkgsToRemove = Array.filter(
        Object.keys(packageJson["devDependencies"]),
        (key) => key.includes("changeset")
      )
      for (const pkg of pkgsToRemove) {
        delete packageJson["devDependencies"][pkg]
      }
      // If git workflows are enabled, remove changesets related workflows
      if (config.projectType.withWorkflows) {
        yield* fs.remove(path.join(config.projectName, ".github", "workflows", "release.yml"))
      }
    }

    // Handle user preferences for Nix flakes
    if (!config.projectType.withNixFlake) {
      yield* Effect.forEach(
        [".envrc", "flake.nix"],
        (file) => fs.remove(path.join(config.projectName, file))
      )
    }

    // Handle user preferences for ESLint
    if (!config.projectType.withESLint) {
      // Remove eslint.config.mjs
      yield* fs.remove(path.join(config.projectName, "eslint.config.mjs"))
      // Remove eslint dependencies
      const eslintDeps = Array.filter(
        Object.keys(packageJson["devDependencies"]),
        (key) => key.includes("eslint")
      )
      for (const dep of eslintDeps) {
        delete packageJson["devDependencies"][dep]
      }
      // Remove linting scripts
      const scriptsToRemove = Array.filter(
        Object.keys(packageJson["scripts"]),
        (key) => key.includes("lint")
      )
      for (const script of scriptsToRemove) {
        delete packageJson["scripts"][script]
      }
      // If git workflows are enabled, remove lint workflows
      if (config.projectType.withWorkflows) {
        const checkWorkflowPath = path.join(config.projectName, ".github", "workflows", "check.yml")
        const checkWorkflow = yield* fs.readFileString(checkWorkflowPath)
        const checkYaml = Yaml.parse(checkWorkflow)
        delete checkYaml["jobs"]["lint"]
        yield* fs.writeFileString(checkWorkflowPath, Yaml.stringify(checkYaml, undefined, 2))
      }
    }

    // Handle user preferences for GitHub workflows
    if (!config.projectType.withWorkflows) {
      // Remove the .github directory
      yield* fs.remove(path.join(config.projectName, ".github"), {
        recursive: true
      })
    }

    // Write out the updated package.json
    yield* fs.writeFileString(
      path.join(config.projectName, "package.json"),
      JSON.stringify(packageJson, undefined, 2)
    )

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Success!").pipe(AnsiDoc.annotate(Ansi.green)),
      AnsiDoc.text(`Effect template project was initialized in:`),
      AnsiDoc.text(config.projectName).pipe(AnsiDoc.annotate(Ansi.cyan))
    ]))

    yield* Effect.logInfo(AnsiDoc.hsep([
      AnsiDoc.text("Take a look at the template's"),
      AnsiDoc.text("README.md").pipe(AnsiDoc.annotate(Ansi.cyan)),
      AnsiDoc.text("for more information")
    ]))

    const filesToCheck = []
    if (config.projectType.withChangesets) {
      filesToCheck.push(path.join(config.projectName, ".changeset", "config.json"))
    }
    if (config.projectType.template === "monorepo") {
      filesToCheck.push(path.join(config.projectName, "packages", "cli", "package.json"))
      filesToCheck.push(path.join(config.projectName, "packages", "domain", "package.json"))
      filesToCheck.push(path.join(config.projectName, "packages", "server", "package.json"))
      filesToCheck.push(path.join(config.projectName, "packages", "cli", "LICENSE"))
      filesToCheck.push(path.join(config.projectName, "packages", "domain", "LICENSE"))
      filesToCheck.push(path.join(config.projectName, "packages", "server", "LICENSE"))
    } else {
      filesToCheck.push(path.join(config.projectName, "package.json"))
      filesToCheck.push(path.join(config.projectName, "LICENSE"))
    }

    yield* Effect.logInfo(AnsiDoc.cats([
      AnsiDoc.hsep([
        AnsiDoc.text("Make sure to replace any"),
        AnsiDoc.text("<PLACEHOLDER>").pipe(AnsiDoc.annotate(Ansi.cyan)),
        AnsiDoc.text("entries in the following files:")
      ]),
      pipe(
        filesToCheck,
        Array.map((file) => AnsiDoc.catWithSpace(AnsiDoc.char("-"), AnsiDoc.text(file))),
        AnsiDoc.vsep,
        AnsiDoc.indent(2)
      )
    ]))
  })
}

const getUserInput = Prompt.select<"example" | "template">({
  message: "What type of project would you like to create?",
  choices: [
    {
      title: "Template",
      value: "template",
      description: "A template project suitable for a package or application"
    },
    {
      title: "Example",
      value: "example",
      description: "An example project demonstrating usage of Effect"
    }
  ]
}).pipe(Prompt.flatMap((type): Prompt.Prompt<ProjectType> => {
  switch (type) {
    case "example": {
      return Prompt.all({
        example: Prompt.select<Example>({
          message: "What project template should be used?",
          choices: [
            {
              title: "HTTP Server",
              value: "http-server",
              description: "An HTTP server application with authentication / authorization"
            }
          ]
        })
      }).pipe(Prompt.map(ProjectType.Example))
    }
    case "template": {
      return Prompt.all({
        template: Prompt.select<Template>({
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
        }),
        withChangesets: Prompt.toggle({
          message: "Initialize project with Changesets?",
          initial: true
        }),
        withNixFlake: Prompt.toggle({
          message: "Initialize project with a Nix flake?",
          initial: true
        }),
        withESLint: Prompt.toggle({
          message: "Initialize project with ESLint?",
          initial: true
        }),
        withWorkflows: Prompt.toggle({
          message: "Initialize project with Effect's recommended GitHub actions?",
          initial: true
        })
      }).pipe(Prompt.map(ProjectType.Template))
    }
  }
}))
