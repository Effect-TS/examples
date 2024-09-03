import { Model } from "@effect/sql"
import { Context, Effect, Layer } from "effect"
import { Group } from "../Domain/Group.js"
import { SqlLive } from "../Sql.js"

const make = Model.makeRepository(Group, {
  tableName: "groups",
  spanPrefix: "GroupsRepo",
  idColumn: "id",
})

export class GroupsRepo extends Context.Tag("Groups/Repo")<
  GroupsRepo,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.effect(GroupsRepo, make).pipe(Layer.provide(SqlLive))
}
