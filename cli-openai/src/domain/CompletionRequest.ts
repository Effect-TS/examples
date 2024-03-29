import * as Schema from "@effect/schema/Schema"
import { pipe } from "effect/Function"
import * as Match from "effect/Match"
import * as ReadonlyArray from "effect/ReadonlyArray"

const Message = Schema.struct({
  role: Schema.literal("user", "assistant"),
  name: Schema.optional(Schema.string, { exact: true }),
  content: Schema.string
})

export const CompletionModels = [
  "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-16k",
  "gpt-4-1106-preview"
] as const

export const CompletionModel = Schema.literal(...CompletionModels)

export class CompletionRequest extends Schema.Class<CompletionRequest>()({
  input: Schema.array(Message),
  model: CompletionModel
}) {
  get contextTokens(): { readonly target: number; readonly max: number } {
    return pipe(
      Match.value(this.model),
      Match.when("gpt-3.5-turbo-16k", () => ({ target: 5000, max: 15000 })),
      Match.when("gpt-4-1106-preview", () => ({ target: 5000, max: 32000 })),
      Match.orElse(() => ({ target: 3500, max: 3500 }))
    )
  }

  get responseTokens(): number {
    return pipe(
      Match.value(this.model),
      Match.when("gpt-3.5-turbo-16k", () => 1028),
      Match.when("gpt-4-1106-preview", () => 1028),
      Match.orElse(() => 500)
    )
  }

  get userMessages(): ReadonlyArray<string> {
    return pipe(
      this.input,
      ReadonlyArray.filter((_) => _.role === "user"),
      ReadonlyArray.map((_) => _.content)
    )
  }
}
