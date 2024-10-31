import { Model } from "@effect/sql"
import { Effect } from "effect"
import { Group } from "../Domain/Group.js"
import { SqlLive } from "../Sql.js"

export class GroupsRepo extends Effect.Service<GroupsRepo>()("Groups/Repo", {
  effect: Model.makeRepository(Group, {
    tableName: "groups",
    spanPrefix: "GroupsRepo",
    idColumn: "id"
  }),
  dependencies: [SqlLive]
}) {}
