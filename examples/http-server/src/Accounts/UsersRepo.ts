import { Model, SqlClient, SqlSchema } from "@effect/sql"
import { Effect, pipe } from "effect"
import { AccessToken } from "../Domain/AccessToken.js"
import { User } from "../Domain/User.js"
import { makeTestLayer } from "../lib/Layer.js"
import { SqlLive } from "../Sql.js"

export class UsersRepo extends Effect.Service<UsersRepo>()(
  "Accounts/UsersRepo",
  {
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const repo = yield* Model.makeRepository(User, {
        tableName: "users",
        spanPrefix: "UsersRepo",
        idColumn: "id"
      })

      const findByAccessTokenSchema = SqlSchema.findOne({
        Request: AccessToken,
        Result: User,
        execute: (key) => sql`select * from users where accessToken = ${key}`
      })
      const findByAccessToken = (apiKey: AccessToken) =>
        pipe(
          findByAccessTokenSchema(apiKey),
          Effect.orDie,
          Effect.withSpan("UsersRepo.findByAccessToken")
        )

      return { ...repo, findByAccessToken } as const
    }),
    dependencies: [SqlLive]
  }
) {
  static Test = makeTestLayer(UsersRepo)({})
}
