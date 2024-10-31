import { Cookies, HttpApiClient, HttpClient } from "@effect/platform"
import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Effect, Ref } from "effect"
import { Api } from "./Api.js"
import { Email } from "./Domain/Email.js"

Effect.gen(function*() {
  const cookies = yield* Ref.make(Cookies.empty)
  const client = yield* HttpApiClient.make(Api, {
    baseUrl: "http://localhost:3000",
    transformClient: HttpClient.withCookiesRef(cookies)
  })
  const user = yield* client.accounts.createUser({
    payload: {
      email: Email.make("joe2.bloggs@example.com")
    }
  })
  console.log(user)
  const me = yield* client.accounts.getUserMe()
  console.log(me)
}).pipe(Effect.provide(NodeHttpClient.layerUndici), NodeRuntime.runMain)
