import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, Option, pipe } from "effect"
import { Accounts } from "../Accounts.js"
import { Api } from "../Api.js"
import { policyUse, withSystemActor } from "../Domain/Policy.js"
import { CurrentUser, UserNotFound } from "../Domain/User.js"
import { AccountsPolicy } from "./Policy.js"
import { security } from "../Api/Security.js"

export const HttpAccountsLive = HttpApiBuilder.group(
  Api,
  "accounts",
  (handlers) =>
    Effect.gen(function* () {
      const accounts = yield* Accounts
      const policy = yield* AccountsPolicy

      return handlers.pipe(
        HttpApiBuilder.handle("updateUser", ({ payload, path }) =>
          pipe(
            accounts.updateUser(path.id, payload),
            policyUse(policy.canUpdate(path.id)),
          ),
        ),
        HttpApiBuilder.handle("getUserMe", () =>
          CurrentUser.pipe(
            Effect.flatMap(accounts.embellishUser),
            withSystemActor,
          ),
        ),
        HttpApiBuilder.handle("getUser", ({ path }) =>
          pipe(
            accounts.findUserById(path.id),
            Effect.flatMap(
              Option.match({
                onNone: () => new UserNotFound({ id: path.id }),
                onSome: Effect.succeed,
              }),
            ),
            policyUse(policy.canRead(path.id)),
          ),
        ),
        accounts.httpSecurity,
        // unprotected
        HttpApiBuilder.handle("createUser", ({ payload }) =>
          accounts.createUser(payload).pipe(
            withSystemActor,
            Effect.tap((user) =>
              HttpApiBuilder.securitySetCookie(security, user.accessToken),
            ),
          ),
        ),
      )
    }),
).pipe(Layer.provide(Accounts.Live), Layer.provide(AccountsPolicy.Live))
