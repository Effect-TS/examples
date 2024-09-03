import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option, pipe } from "effect"
import { AccountsRepo } from "./Accounts/AccountsRepo.js"
import { UsersRepo } from "./Accounts/UsersRepo.js"
import {
  AccessToken,
  accessTokenFromRedacted,
  accessTokenFromString,
} from "./Domain/AccessToken.js"
import { Account } from "./Domain/Account.js"
import { policyRequire, Unauthorized } from "./Domain/Policy.js"
import {
  CurrentUser,
  User,
  UserId,
  UserNotFound,
  UserWithSensitive,
} from "./Domain/User.js"
import { SqlLive, SqlTest } from "./Sql.js"
import { Uuid } from "./Uuid.js"
import { HttpApiBuilder } from "@effect/platform"
import { security } from "./Api/Security.js"

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const accountRepo = yield* AccountsRepo
  const userRepo = yield* UsersRepo
  const uuid = yield* Uuid

  const createUser = (user: typeof User.jsonCreate.Type) =>
    accountRepo.insert(Account.insert.make({})).pipe(
      Effect.tap((account) => Effect.annotateCurrentSpan("account", account)),
      Effect.bindTo("account"),
      Effect.bind("accessToken", () =>
        uuid.generate.pipe(Effect.map(accessTokenFromString)),
      ),
      Effect.bind("user", ({ account, accessToken }) =>
        userRepo.insert(
          User.insert.make({
            ...user,
            accountId: account.id,
            accessToken,
          }),
        ),
      ),
      Effect.map(
        ({ user, account }) =>
          new UserWithSensitive({
            ...user,
            account,
          }),
      ),
      sql.withTransaction,
      Effect.orDie,
      Effect.withSpan("Accounts.createUser", { attributes: { user } }),
      policyRequire("User", "create"),
    )

  const updateUser = (id: UserId, user: Partial<typeof User.jsonUpdate.Type>) =>
    userRepo.findById(id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => new UserNotFound({ id }),
          onSome: Effect.succeed,
        }),
      ),
      Effect.andThen((previous) =>
        userRepo.update({
          ...previous,
          ...user,
          id,
          updatedAt: undefined,
        }),
      ),
      sql.withTransaction,
      Effect.catchTag("SqlError", (err) => Effect.die(err)),
      Effect.withSpan("Accounts.updateUser", { attributes: { id, user } }),
      policyRequire("User", "update"),
    )

  const findUserByAccessToken = (apiKey: AccessToken) =>
    pipe(
      userRepo.findByAccessToken(apiKey),
      Effect.withSpan("Accounts.findUserByAccessToken"),
      policyRequire("User", "read"),
    )

  const findUserById = (id: UserId) =>
    pipe(
      userRepo.findById(id),
      Effect.withSpan("Accounts.findUserById", {
        attributes: { id },
      }),
      policyRequire("User", "read"),
    )

  const embellishUser = (user: User) =>
    pipe(
      accountRepo.findById(user.accountId),
      Effect.flatten,
      Effect.map((account) => new UserWithSensitive({ ...user, account })),
      Effect.orDie,
      Effect.withSpan("Accounts.embellishUser", {
        attributes: { id: user.id },
      }),
      policyRequire("User", "readSensitive"),
    )

  const httpSecurity = HttpApiBuilder.middlewareSecurity(
    security,
    CurrentUser,
    (token) =>
      userRepo.findByAccessToken(accessTokenFromRedacted(token)).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () =>
              new Unauthorized({
                actorId: UserId.make(-1),
                entity: "User",
                action: "read",
              }),
            onSome: Effect.succeed,
          }),
        ),
        Effect.withSpan("Accounts.httpSecurity"),
      ),
  )

  return {
    createUser,
    updateUser,
    findUserByAccessToken,
    findUserById,
    embellishUser,
    httpSecurity,
  } as const
})

export class Accounts extends Effect.Tag("Accounts")<
  Accounts,
  Effect.Effect.Success<typeof make>
>() {
  static layer = Layer.effect(Accounts, make)

  static Live = this.layer.pipe(
    Layer.provide(SqlLive),
    Layer.provide(AccountsRepo.Live),
    Layer.provide(UsersRepo.Live),
    Layer.provide(Uuid.Live),
  )

  static Test = this.layer.pipe(
    Layer.provideMerge(SqlTest),
    Layer.provideMerge(Uuid.Test),
  )
}
