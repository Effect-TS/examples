#!/usr/bin/env node

import * as CliConfig from "@effect/cli/CliConfig"
import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as Ansi from "@effect/printer-ansi/Ansi"
import * as AnsiDoc from "@effect/printer-ansi/AnsiDoc"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as LogLevel from "effect/LogLevel"
import { cli } from "./Cli.js"
import { GitHub } from "./GitHub.js"
import { AnsiDocLogger } from "./Logger.js"

const MainLive = GitHub.Live.pipe(
  Layer.provideMerge(Layer.mergeAll(
    Logger.replace(Logger.defaultLogger, AnsiDocLogger),
    Logger.minimumLogLevel(LogLevel.Info),
    CliConfig.layer({ showBuiltIns: false }),
    NodeContext.layer,
    NodeHttpClient.layerUndici
  ))
)

cli(process.argv).pipe(
  Effect.catchTags({
    QuitException: () =>
      Effect.logError(AnsiDoc.cat(
        AnsiDoc.hardLine,
        AnsiDoc.text("Exiting...").pipe(AnsiDoc.annotate(Ansi.red))
      ))
  }),
  Effect.orDie,
  Effect.provide(MainLive),
  NodeRuntime.runMain({
    disablePrettyLogger: true,
    disableErrorReporting: true
  })
)
