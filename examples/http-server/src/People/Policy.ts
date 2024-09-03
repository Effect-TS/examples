import { Effect, Layer, pipe } from "effect"
import { policy, policyCompose } from "../Domain/Policy.js"
import { Person } from "../Domain/Person.js"
import { Group } from "../Domain/Group.js"
import { GroupsPolicy } from "../Groups/Policy.js"

const make = Effect.gen(function* () {
  const groupsPolicy = yield* GroupsPolicy

  const canCreate = (group: Group, _person: typeof Person.jsonCreate.Type) =>
    pipe(
      groupsPolicy.canUpdate(group),
      policyCompose(
        policy("Person", "create", (_actor) => Effect.succeed(true)),
      ),
    )

  return { canCreate } as const
})

export class PeoplePolicy extends Effect.Tag("People/Policy")<
  PeoplePolicy,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(PeoplePolicy, make).pipe(
    Layer.provide(GroupsPolicy.Live),
  )
}
