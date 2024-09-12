import { Model, SqlClient, SqlSchema } from "@effect/sql"
import { Effect, Layer, pipe } from "effect"
import { User } from "../Domain/User.js"
import { SqlLive } from "../Sql.js"
import { AccessToken } from "../Domain/AccessToken.js"
import { makeTestLayer } from "../lib/Layer.js"

export const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const repo = yield* Model.makeRepository(User, {
    tableName: "users",
    spanPrefix: "UsersRepo",
    idColumn: "id",
  })

  const findByAccessTokenSchema = SqlSchema.findOne({
    Request: AccessToken,
    Result: User,
    execute: (key) => sql`select * from users where accessToken = ${key}`,
  })
  const findByAccessToken = (apiKey: AccessToken) =>
    pipe(
      findByAccessTokenSchema(apiKey),
      Effect.orDie,
      Effect.withSpan("UsersRepo.findByAccessToken"),
    )

  return { ...repo, findByAccessToken } as const
})

export class UsersRepo extends Effect.Tag("Accounts/UsersRepo")<
  UsersRepo,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(UsersRepo, make).pipe(Layer.provide(SqlLive))
  static Test = makeTestLayer(UsersRepo)({})
}
