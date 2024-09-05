import * as NodeSink from "@effect/platform-node/NodeSink"
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
import * as Tar from "tar"
import type { TemplateOptions } from "./Domain.js"

export class TarExtractionError extends Data.TaggedError("TarExtractionError")<{
  readonly cause: unknown
  readonly directory: string
}> {}

export const make = Effect.gen(function*() {
  const client = yield* HttpClient.HttpClient

  const codeloadBaseUrl = "https://codeload.github.com"

  const codeloadClient = client.pipe(
    HttpClient.filterStatusOk,
    HttpClient.mapRequest(HttpClientRequest.prependUrl(codeloadBaseUrl))
  )

  const downloadExample = (directory: string, example: string) =>
    HttpClientRequest.get("/Effect-TS/examples/tar.gz/feat/examples").pipe(
      codeloadClient,
      HttpClientResponse.stream,
      Stream.run(NodeSink.fromWritable(() =>
        Tar.extract({
          cwd: directory,
          strip: 2 + example.split("/").length,
          filter: (path) => path.includes(`examples-feat-examples/examples/${example}`)
        }), (cause) => new TarExtractionError({ cause, directory })))
    )

  const downloadTemplate = (directory: string, options: TemplateOptions) =>
    HttpClientRequest.get("/Effect-TS/examples/tar.gz/feat/examples").pipe(
      codeloadClient,
      HttpClientResponse.stream,
      Stream.run(NodeSink.fromWritable(() =>
        Tar.extract({
          cwd: directory,
          strip: 2 + options.projectType.split("/").length,
          filter: (path) => path.includes(`examples-feat-examples/templates/${options.projectType}`)
        }), (cause) => new TarExtractionError({ cause, directory })))
    )

  return {
    downloadExample,
    downloadTemplate
  } as const
})

export class GitHub extends Effect.Tag("app/GitHub")<
  GitHub,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(this, make)
}
