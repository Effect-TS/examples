import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem"
import * as FileSystem from "@effect/platform/FileSystem"
import { Effect, pipe } from "effect"
import * as path from "node:path"

const read = pipe(
  FileSystem.FileSystem,
  Effect.flatMap((fileSystem) => fileSystem.readFileString("package.json")),
  Effect.map((_) => JSON.parse(_)),
  Effect.map((json) => ({
    name: json.name,
    version: json.version,
    description: json.description,
    bin: {
      "create-effect-app": "bin.cjs"
    },
    engines: json.engines,
    repository: json.repository,
    author: json.author,
    license: json.license,
    bugs: json.bugs,
    homepage: json.homepage,
    tags: json.tags,
    keywords: json.keywords,
    dependencies: json.dependencies
  }))
)

const pathTo = path.join("dist", "package.json")

const write = (pkg: object) =>
  FileSystem.FileSystem.pipe(
    Effect.flatMap((fileSystem) => fileSystem.writeFileString(pathTo, JSON.stringify(pkg, null, 2)))
  )

const program = pipe(
  Effect.log(`Copying package.json to ${pathTo}...`),
  Effect.zipRight(read),
  Effect.flatMap(write),
  Effect.provide(NodeFileSystem.layer)
)

Effect.runPromise(program)
