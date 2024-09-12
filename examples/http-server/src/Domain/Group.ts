import { Schema } from "@effect/schema"
import { Model } from "@effect/sql"
import { AccountId } from "./Account.js"
import { HttpApiSchema } from "@effect/platform"

export const GroupId = Schema.Number.pipe(Schema.brand("GroupId"))
export type GroupId = typeof GroupId.Type

export const GroupIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(GroupId),
)

export class Group extends Model.Class<Group>("Group")({
  id: Model.Generated(GroupId),
  ownerId: Model.GeneratedByApp(AccountId),
  name: Schema.NonEmptyTrimmedString,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export class GroupNotFound extends Schema.TaggedError<GroupNotFound>()(
  "GroupNotFound",
  { id: GroupId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
