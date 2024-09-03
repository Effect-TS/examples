import { NodeRuntime } from "@effect/platform-node"
import { Layer } from "effect"
import { HttpLive } from "./Http.js"
import { TracingLive } from "./Tracing.js"

HttpLive.pipe(Layer.provide(TracingLive), Layer.launch, NodeRuntime.runMain)
