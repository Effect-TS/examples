import { Effect, Layer } from "effect"
import { UserId } from "../Domain/User.js"
import { policy } from "../Domain/Policy.js"

const make = Effect.gen(function* () {
  const canUpdate = (toUpdate: UserId) =>
    policy("User", "update", (actor) => Effect.succeed(actor.id === toUpdate))

  const canRead = (toRead: UserId) =>
    policy("User", "read", (actor) => Effect.succeed(actor.id === toRead))

  const canReadSensitive = (toRead: UserId) =>
    policy("User", "readSensitive", (actor) =>
      Effect.succeed(actor.id === toRead),
    )

  return { canUpdate, canRead, canReadSensitive } as const
})

export class AccountsPolicy extends Effect.Tag("Accounts/Policy")<
  AccountsPolicy,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(AccountsPolicy, make)
}
