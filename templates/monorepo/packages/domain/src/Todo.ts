import { Schema } from "@effect/schema"
import { Model } from "@effect/sql"

export const TodoId = Schema.Number.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const TodoIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(TodoId)
)

export class Todo extends Model.Class<Todo>("Todo")({
  id: Model.Generated(TodoId),
  task: Schema.NonEmptyTrimmedString,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate
}) {}

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()("TodoNotFound", {
  id: TodoId
}) {}
