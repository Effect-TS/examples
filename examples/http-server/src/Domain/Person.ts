import { Model } from "@effect/sql"
import { Schema } from "effect"
import { GroupId } from "./Group.js"

export const PersonId = Schema.Number.pipe(Schema.brand("PersonId"))
export type PersonId = typeof PersonId.Type

export const PersonIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(PersonId)
)

export class Person extends Model.Class<Person>("Person")({
  id: Model.Generated(PersonId),
  groupId: Model.GeneratedByApp(GroupId),
  firstName: Schema.NonEmptyTrimmedString,
  lastName: Schema.NonEmptyTrimmedString,
  dateOfBirth: Model.FieldOption(Model.Date),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate
}) {}

export class PersonNotFound extends Schema.TaggedError<PersonNotFound>()(
  "PersonNotFound",
  {
    id: PersonId
  }
) {}
