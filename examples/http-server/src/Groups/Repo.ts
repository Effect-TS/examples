import { Model } from "@effect/sql"
import { Cache, Context, Effect, Layer } from "effect"
import { Group, GroupId } from "../Domain/Group.js"
import { SqlLive } from "../Sql.js"

const make = Effect.gen(function* () {
  const repo = yield* Model.makeRepository(Group, {
    tableName: "groups",
    spanPrefix: "GroupsRepo",
    idColumn: "id",
  })

  const findById = yield* Cache.make({
    lookup: repo.findById,
    capacity: 1024,
    timeToLive: 30_000,
  })

  return {
    ...repo,
    findById(id: GroupId) {
      return findById.get(id)
    },
  }
})

export class GroupsRepo extends Context.Tag("Groups/Repo")<
  GroupsRepo,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(GroupsRepo, make).pipe(Layer.provide(SqlLive))
}
