import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "@effect/schema"

export const TodoId = Schema.Number.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const TodoIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(TodoId)
)

export class Todo extends Schema.Class<Todo>("Todo")({
  id: TodoId,
  text: Schema.NonEmptyTrimmedString,
  done: Schema.Boolean
}) {}

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()("TodoNotFound", {
  id: Schema.Number
}) {}

export class TodosApiGroup extends HttpApiGroup.make("todos").pipe(
  HttpApiGroup.add(
    HttpApiEndpoint.get("getAllTodos", "/todos").pipe(
      HttpApiEndpoint.setSuccess(Schema.Array(Todo))
    )
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.get("getTodoById", "/todos/:id").pipe(
      HttpApiEndpoint.setSuccess(Todo),
      HttpApiEndpoint.addError(TodoNotFound, { status: 404 }),
      HttpApiEndpoint.setPath(Schema.Struct({ id: Schema.NumberFromString }))
    )
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.post("createTodo", "/todos").pipe(
      HttpApiEndpoint.setSuccess(Todo),
      HttpApiEndpoint.setPayload(Schema.Struct({ text: Schema.NonEmptyTrimmedString }))
    )
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.patch("completeTodo", "/todos/:id").pipe(
      HttpApiEndpoint.setSuccess(Todo),
      HttpApiEndpoint.addError(TodoNotFound, { status: 404 }),
      HttpApiEndpoint.setPath(Schema.Struct({ id: Schema.NumberFromString }))
    )
  ),
  HttpApiGroup.add(
    HttpApiEndpoint.del("removeTodo", "/todos/:id").pipe(
      HttpApiEndpoint.setSuccess(Schema.Void),
      HttpApiEndpoint.addError(TodoNotFound, { status: 404 }),
      HttpApiEndpoint.setPath(Schema.Struct({ id: Schema.NumberFromString }))
    )
  )
) {}

export class TodosApi extends HttpApi.empty.pipe(HttpApi.addGroup(TodosApiGroup)) {}
