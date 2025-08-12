import { Effect, pipe } from "effect"
import type { GroupId } from "../Domain/Group.js"
import type { Person, PersonId } from "../Domain/Person.js"
import { policy, policyCompose, Unauthorized } from "../Domain/Policy.js"
import { Groups } from "../Groups.js"
import { GroupsPolicy } from "../Groups/Policy.js"
import { People } from "../People.js"

export class PeoplePolicy extends Effect.Service<PeoplePolicy>()(
  "People/Policy",
  {
    effect: Effect.gen(function*() {
      const groupsPolicy = yield* GroupsPolicy
      const groups = yield* Groups
      const people = yield* People

      const canCreate = (
        groupId: GroupId,
        _person: typeof Person.jsonCreate.Type
      ) =>
        Unauthorized.refail(
          "Person",
          "create"
        )(
          groups.with(groupId, (group) =>
            pipe(
              groupsPolicy.canUpdate(group),
              policyCompose(
                policy("Person", "create", (_actor) => Effect.succeed(true))
              )
            ))
        )

      const canRead = (id: PersonId) =>
        Unauthorized.refail(
          "Person",
          "read"
        )(
          people.with(id, (person) =>
            groups.with(person.groupId, (group) =>
              pipe(
                groupsPolicy.canUpdate(group),
                policyCompose(
                  policy("Person", "read", (_actor) => Effect.succeed(true))
                )
              )))
        )

      return { canCreate, canRead } as const
    }),
    dependencies: [GroupsPolicy.Default, Groups.Default, People.Default]
  }
) {}
