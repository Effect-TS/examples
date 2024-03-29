import * as Schema from "@effect/schema/Schema"
import * as Brand from "effect/Brand"

/**
 * Represents the character code for the forward slash character (i.e. `/`).
 */
const CHAR_FORWARD_SLASH = 47

/**
 * Represents an absolute file system path.
 */
export type AbsolutePath = string & Brand.Brand<"AbsolutePath">

export const AbsolutePath = Schema.string.pipe(Schema.fromBrand(
  Brand.refined<AbsolutePath>(
    (path) => path.charCodeAt(0) === CHAR_FORWARD_SLASH,
    (path) => Brand.error(`The provided path "${path}" is not an absolute path`)
  )
))
