import { HttpApiClient } from "@effect/platform"
import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { Api } from "./Api.js"
import { Email } from "./Domain/Email.js"

Effect.gen(function* () {
  const client = yield* HttpApiClient.make(Api, {
    baseUrl: "http://localhost:3000",
  })
  const user = yield* client.accounts.createUser({
    payload: {
      email: Email.make("john.bloggs@example.com"),
    },
  })
  console.log(user)
}).pipe(Effect.provide(NodeHttpClient.layerUndici), NodeRuntime.runMain)
