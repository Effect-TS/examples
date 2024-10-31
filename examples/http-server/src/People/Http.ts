import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer, pipe } from "effect"
import { AuthenticationLive } from "../Accounts/Http.js"
import { Api } from "../Api.js"
import { PersonNotFound } from "../Domain/Person.js"
import { policyUse } from "../Domain/Policy.js"
import { Groups } from "../Groups.js"
import { People } from "../People.js"
import { PeoplePolicy } from "./Policy.js"

export const HttpPeopleLive = HttpApiBuilder.group(Api, "people", (handlers) =>
  Effect.gen(function*() {
    const groups = yield* Groups
    const people = yield* People
    const policy = yield* PeoplePolicy

    return handlers
      .handle("create", ({ path, payload }) =>
        groups.with(path.groupId, (group) =>
          pipe(
            people.create(group.id, payload),
            policyUse(policy.canCreate(group.id, payload))
          )))
      .handle("findById", ({ path }) =>
        pipe(
          people.findById(path.id),
          Effect.flatten,
          Effect.mapError(() => new PersonNotFound({ id: path.id })),
          policyUse(policy.canRead(path.id))
        ))
  })).pipe(
    Layer.provide([
      Groups.Default,
      People.Default,
      PeoplePolicy.Default,
      AuthenticationLive
    ])
  )
