#!/usr/bin/env node

import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { cli } from "./Cli.js"

const MainLive = Layer.mergeAll(
  NodeContext.layer,
  NodeHttpClient.layerUndici
)

cli(process.argv).pipe(
  Effect.provide(MainLive),
  NodeRuntime.runMain
  // NodeRuntime.runMain({ disableErrorReporting: true })
)
