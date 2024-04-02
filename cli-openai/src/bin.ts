#!/usr/bin/env node

import * as DevTools from "@effect/experimental/DevTools"
import * as NodeContext from "@effect/platform-node/NodeContext"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as Config from "effect/Config"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Cli from "./Cli.js"
import * as OpenAI from "./OpenAI.js"

const OpenAILive = OpenAI.OpenAI.Live({
  apiKey: Config.secret("apiKey"),
  organization: Config.option(Config.secret("organization"))
})

const ConfigProviderLive = Layer.setConfigProvider(
  ConfigProvider.fromEnv({ pathDelim: "_", seqDelim: "," }).pipe(
    ConfigProvider.nested("openai"),
    ConfigProvider.constantCase
  )
)

const MainLive = Layer.mergeAll(NodeContext.layer, OpenAILive).pipe(
  Layer.provide(DevTools.layer()),
  Layer.provide(ConfigProviderLive)
)

Cli.run(process.argv).pipe(
  Effect.provide(MainLive),
  NodeRuntime.runMain
)
