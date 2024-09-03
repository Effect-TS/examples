import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, pipe } from "effect"
import { Accounts } from "../Accounts.js"
import { Api } from "../Api.js"
import { policyUse } from "../Domain/Policy.js"
import { Groups } from "../Groups.js"
import { People } from "../People.js"
import { PeoplePolicy } from "./Policy.js"

export const HttpPeopleLive = HttpApiBuilder.group(Api, "people", (handlers) =>
  Effect.gen(function* () {
    const groups = yield* Groups
    const people = yield* People
    const policy = yield* PeoplePolicy
    const accounts = yield* Accounts

    return handlers.pipe(
      HttpApiBuilder.handle("create", ({ payload, path }) =>
        groups.with(path.groupId, (group) =>
          pipe(
            people.create(group.id, payload),
            policyUse(policy.canCreate(group, payload)),
          ),
        ),
      ),
      accounts.httpSecurity,
    )
  }),
).pipe(
  Layer.provide(Accounts.Live),
  Layer.provide(Groups.Live),
  Layer.provide(People.Live),
  Layer.provide(PeoplePolicy.Live),
)
