import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, pipe } from "effect"
import { AuthenticationLive } from "../Accounts/Http.js"
import { Api } from "../Api.js"
import { policyUse } from "../Domain/Policy.js"
import { CurrentUser } from "../Domain/User.js"
import { Groups } from "../Groups.js"
import { GroupsPolicy } from "./Policy.js"

export const HttpGroupsLive = HttpApiBuilder.group(Api, "groups", (handlers) =>
  Effect.gen(function*() {
    const groups = yield* Groups
    const policy = yield* GroupsPolicy

    return handlers
      .handle("create", ({ payload }) =>
        CurrentUser.pipe(
          Effect.flatMap((user) => groups.create(user.accountId, payload)),
          policyUse(policy.canCreate(payload))
        ))
      .handle("update", ({ path, payload }) =>
        groups.with(path.id, (group) =>
          pipe(
            groups.update(group, payload),
            policyUse(policy.canUpdate(group))
          )))
  })).pipe(
    Layer.provide([AuthenticationLive, Groups.Default, GroupsPolicy.Default])
  )
