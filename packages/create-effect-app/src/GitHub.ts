import * as HelpDoc from "@effect/cli/HelpDoc"
import * as ValidationError from "@effect/cli/ValidationError"
import * as NodeSink from "@effect/platform-node/NodeSink"
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import * as Tar from "tar"
import type { ExampleConfig, TemplateConfig } from "./Cli.js"

export class GitHub extends Effect.Service<GitHub>()("app/GitHub", {
  accessors: true,
  effect: Effect.gen(function*() {
    const client = yield* HttpClient.HttpClient

    const codeloadBaseUrl = "https://codeload.github.com"

    const codeloadClient = client.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(HttpClientRequest.prependUrl(codeloadBaseUrl))
    )

    const downloadExample = (config: ExampleConfig) =>
      codeloadClient.get("/Effect-TS/examples/tar.gz/main").pipe(
        HttpClientResponse.stream,
        Stream.run(NodeSink.fromWritable(
          () =>
            Tar.extract({
              cwd: config.projectName,
              strip: 2 + config.projectType.example.split("/").length,
              filter: (path) => path.includes(`examples-main/examples/${config.projectType.example}`)
            }),
          () => ValidationError.invalidValue(HelpDoc.p(`Failed to download example ${config.projectType.example}`))
        ))
      )

    const downloadTemplate = (config: TemplateConfig) =>
      codeloadClient.get("/Effect-TS/examples/tar.gz/main").pipe(
        HttpClientResponse.stream,
        Stream.run(NodeSink.fromWritable(
          () =>
            Tar.extract({
              cwd: config.projectName,
              strip: 2 + config.projectType.template.split("/").length,
              filter: (path) => path.includes(`examples-main/templates/${config.projectType.template}`)
            }),
          () => ValidationError.invalidValue(HelpDoc.p(`Failed to download template ${config.projectType.template}`))
        ))
      )

    return {
      downloadExample,
      downloadTemplate
    } as const
  })
}) {}
