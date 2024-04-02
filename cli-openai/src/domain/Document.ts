import * as Schema from "@effect/schema/Schema"
import * as AbsolutePath from "./AbsolutePath.js"

/**
 * Represents a document whose content can be chunked and used to create an
 * embedding.
 */
export class Document extends Schema.Class<Document>()({
  path: AbsolutePath.AbsolutePath,
  content: Schema.string
}) {}
