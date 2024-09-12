import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, pipe } from "effect"
import { Accounts } from "../Accounts.js"
import { Api } from "../Api.js"
import { policyUse } from "../Domain/Policy.js"
import { CurrentUser } from "../Domain/User.js"
import { Groups } from "../Groups.js"
import { GroupsPolicy } from "./Policy.js"

export const HttpGroupsLive = HttpApiBuilder.group(Api, "groups", (handlers) =>
  Effect.gen(function* () {
    const groups = yield* Groups
    const policy = yield* GroupsPolicy
    const accounts = yield* Accounts

    return handlers.pipe(
      HttpApiBuilder.handle("create", ({ payload }) =>
        CurrentUser.pipe(
          Effect.flatMap((user) => groups.create(user.accountId, payload)),
          policyUse(policy.canCreate(payload)),
        ),
      ),
      HttpApiBuilder.handle("update", ({ payload, path }) =>
        groups.with(path.id, (group) =>
          pipe(
            groups.update(group, payload),
            policyUse(policy.canUpdate(group)),
          ),
        ),
      ),
      accounts.httpSecurity,
    )
  }),
).pipe(
  Layer.provide(Accounts.Live),
  Layer.provide(Groups.Live),
  Layer.provide(GroupsPolicy.Live),
)
