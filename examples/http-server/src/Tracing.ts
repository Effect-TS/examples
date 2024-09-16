import * as NodeSdk from "@effect/opentelemetry/NodeSdk"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base"
import { Config, Effect, Layer, Option, Redacted } from "effect"

export const TracingLive = Layer.unwrapEffect(
  Effect.gen(function*() {
    const apiKey = yield* Config.option(Config.redacted("HONEYCOMB_API_KEY"))
    const dataset = yield* Config.withDefault(
      Config.string("HONEYCOMB_DATASET"),
      "my-effect-app"
    )
    if (Option.isNone(apiKey)) {
      const endpoint = yield* Config.option(
        Config.string("OTEL_EXPORTER_OTLP_ENDPOINT")
      )
      if (Option.isNone(endpoint)) {
        return Layer.empty
      }
      return NodeSdk.layer(() => ({
        resource: {
          serviceName: dataset
        },
        spanProcessor: new BatchSpanProcessor(
          new OTLPTraceExporter({ url: `${endpoint.value}/v1/traces` })
        )
      }))
    }

    const headers = {
      "X-Honeycomb-Team": Redacted.value(apiKey.value),
      "X-Honeycomb-Dataset": dataset
    }

    return NodeSdk.layer(() => ({
      resource: {
        serviceName: dataset
      },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: "https://api.honeycomb.io/v1/traces",
          headers
        })
      )
    }))
  })
)
