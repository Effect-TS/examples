import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, Option, pipe } from "effect"
import { Accounts } from "../Accounts.js"
import { Api } from "../Api.js"
import { accessTokenFromRedacted } from "../Domain/AccessToken.js"
import { policyUse, Unauthorized, withSystemActor } from "../Domain/Policy.js"
import { CurrentUser, UserId, UserNotFound } from "../Domain/User.js"
import { Authentication } from "./Api.js"
import { AccountsPolicy } from "./Policy.js"
import { UsersRepo } from "./UsersRepo.js"

export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function*() {
    const userRepo = yield* UsersRepo

    return Authentication.of({
      cookie: (token) =>
        userRepo.findByAccessToken(accessTokenFromRedacted(token)).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                new Unauthorized({
                  actorId: UserId.make(-1),
                  entity: "User",
                  action: "read"
                }),
              onSome: Effect.succeed
            })
          ),
          Effect.withSpan("Authentication.cookie")
        )
    })
  })
).pipe(Layer.provide(UsersRepo.Default))

export const HttpAccountsLive = HttpApiBuilder.group(
  Api,
  "accounts",
  (handlers) =>
    Effect.gen(function*() {
      const accounts = yield* Accounts
      const policy = yield* AccountsPolicy

      return handlers
        .handle("updateUser", ({ path, payload }) =>
          pipe(
            accounts.updateUser(path.id, payload),
            policyUse(policy.canUpdate(path.id))
          ))
        .handle("getUserMe", () =>
          CurrentUser.pipe(
            Effect.flatMap(accounts.embellishUser),
            withSystemActor
          ))
        .handle("getUser", ({ path }) =>
          pipe(
            accounts.findUserById(path.id),
            Effect.flatMap(
              Option.match({
                onNone: () => new UserNotFound({ id: path.id }),
                onSome: Effect.succeed
              })
            ),
            policyUse(policy.canRead(path.id))
          ))
        .handle("createUser", ({ payload }) =>
          accounts.createUser(payload).pipe(
            withSystemActor,
            Effect.tap((user) =>
              HttpApiBuilder.securitySetCookie(
                Authentication.security.cookie,
                user.accessToken
              )
            )
          ))
    })
).pipe(
  Layer.provide([Accounts.Default, AccountsPolicy.Default, AuthenticationLive])
)
