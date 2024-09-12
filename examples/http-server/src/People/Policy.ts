import { Effect, Layer, pipe } from "effect"
import { policy, policyCompose, Unauthorized } from "../Domain/Policy.js"
import { Person, PersonId } from "../Domain/Person.js"
import { GroupId } from "../Domain/Group.js"
import { GroupsPolicy } from "../Groups/Policy.js"
import { Groups } from "../Groups.js"
import { People } from "../People.js"

const make = Effect.gen(function* () {
  const groupsPolicy = yield* GroupsPolicy
  const groups = yield* Groups
  const people = yield* People

  const canCreate = (
    groupId: GroupId,
    _person: typeof Person.jsonCreate.Type,
  ) =>
    Unauthorized.refail(
      "Person",
      "create",
    )(
      groups.with(groupId, (group) =>
        pipe(
          groupsPolicy.canUpdate(group),
          policyCompose(
            policy("Person", "create", (_actor) => Effect.succeed(true)),
          ),
        ),
      ),
    )

  const canRead = (id: PersonId) =>
    Unauthorized.refail(
      "Person",
      "read",
    )(
      people.with(id, (person) =>
        groups.with(person.groupId, (group) =>
          pipe(
            groupsPolicy.canUpdate(group),
            policyCompose(
              policy("Person", "read", (_actor) => Effect.succeed(true)),
            ),
          ),
        ),
      ),
    )

  return { canCreate, canRead } as const
})

export class PeoplePolicy extends Effect.Tag("People/Policy")<
  PeoplePolicy,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(PeoplePolicy, make).pipe(
    Layer.provide(GroupsPolicy.Live),
    Layer.provide(Groups.Live),
    Layer.provide(People.Live),
  )
}
