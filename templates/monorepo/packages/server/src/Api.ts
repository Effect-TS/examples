import { HttpApiBuilder } from "@effect/platform"
import { TodosApi } from "@template/domain/TodosApi"
import { Effect, Layer } from "effect"
import { TodosRepository } from "./TodosRepository.js"

const TodosApiLive = HttpApiBuilder.group(TodosApi, "todos", (handlers) =>
  Effect.gen(function*() {
    const todos = yield* TodosRepository
    return handlers.pipe(
      HttpApiBuilder.handle("getAllTodos", () => todos.getAll),
      HttpApiBuilder.handle("getTodoById", ({ path: { id } }) => todos.getById(id)),
      HttpApiBuilder.handle("createTodo", ({ payload: { text } }) => todos.create(text)),
      HttpApiBuilder.handle("completeTodo", ({ path: { id } }) => todos.complete(id)),
      HttpApiBuilder.handle("removeTodo", ({ path: { id } }) => todos.remove(id))
    )
  }))

export const ApiLive = HttpApiBuilder.api(TodosApi).pipe(
  Layer.provide(TodosApiLive)
)
