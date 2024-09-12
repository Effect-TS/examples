import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from "@effect/platform"
import { Layer } from "effect"
import { NodeHttpServer } from "@effect/platform-node"
import { createServer } from "http"
import { Api } from "./Api.js"
import { HttpAccountsLive } from "./Accounts/Http.js"
import { HttpGroupsLive } from "./Groups/Http.js"
import { HttpPeopleLive } from "./People/Http.js"

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(HttpAccountsLive),
  Layer.provide(HttpGroupsLive),
  Layer.provide(HttpPeopleLive),
)

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
)
