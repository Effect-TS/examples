import { Schema } from "effect"

export const Email = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  Schema.annotations({
    title: "Email",
    description: "An email address"
  }),
  Schema.brand("Email"),
  Schema.annotations({ title: "Email" })
)

export type Email = typeof Email.Type
