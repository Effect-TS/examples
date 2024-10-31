import { Effect, Layer } from "effect"
import * as Api from "uuid"

export class Uuid extends Effect.Service<Uuid>()("Uuid", {
  succeed: {
    generate: Effect.sync(() => Api.v7())
  }
}) {
  static Test = Layer.succeed(
    Uuid,
    new Uuid({
      generate: Effect.succeed("test-uuid")
    })
  )
}
