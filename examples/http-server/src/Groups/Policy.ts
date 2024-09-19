import { Effect, Layer } from "effect"
import type { Group } from "../Domain/Group.js"
import { policy } from "../Domain/Policy.js"

// eslint-disable-next-line require-yield
const make = Effect.gen(function*() {
  const canCreate = (_group: typeof Group.jsonCreate.Type) =>
    policy("Group", "create", (_actor) => Effect.succeed(true))

  const canUpdate = (group: Group) =>
    policy("Group", "update", (actor) => Effect.succeed(group.ownerId === actor.accountId))

  return { canCreate, canUpdate } as const
})

export class GroupsPolicy extends Effect.Tag("Groups/Policy")<
  GroupsPolicy,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(GroupsPolicy, make)
}
