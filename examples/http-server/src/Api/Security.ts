import { HttpApiSecurity } from "@effect/platform"

export const security = HttpApiSecurity.apiKey({
  in: "cookie",
  key: "token",
})
