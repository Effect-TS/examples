import { Effect } from "effect"
import type { Group } from "../Domain/Group.js"
import { policy } from "../Domain/Policy.js"

export class GroupsPolicy extends Effect.Service<GroupsPolicy>()(
  "Groups/Policy",
  {
    // eslint-disable-next-line require-yield
    effect: Effect.gen(function*() {
      const canCreate = (_group: typeof Group.jsonCreate.Type) =>
        policy("Group", "create", (_actor) => Effect.succeed(true))

      const canUpdate = (group: Group) =>
        policy("Group", "update", (actor) => Effect.succeed(group.ownerId === actor.accountId))

      return { canCreate, canUpdate } as const
    })
  }
) {}
