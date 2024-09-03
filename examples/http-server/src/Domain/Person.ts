import { Schema } from "@effect/schema"
import { Model } from "@effect/sql"
import { GroupId } from "./Group.js"

export const PersonId = Schema.Number.pipe(Schema.brand("PersonId"))
export type PersonId = typeof PersonId.Type

export class Person extends Model.Class<Person>("Person")({
  id: Model.Generated(PersonId),
  groupId: Model.GeneratedByApp(GroupId),
  firstName: Schema.NonEmptyTrimmedString,
  lastName: Schema.NonEmptyTrimmedString,
  dateOfBirth: Model.FieldOption(Model.Date),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}
