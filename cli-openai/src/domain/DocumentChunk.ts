import * as Schema from "@effect/schema/Schema"
import * as Hash from "effect/Hash"
import * as Option from "effect/Option"
import TikToken from "tiktoken-node"
import * as AbsolutePath from "./AbsolutePath.js"

const tokenizer = TikToken.encodingForModel("gpt-3.5-turbo")

export class ParsedDocumentChunk extends Schema.Class<ParsedDocumentChunk>()({
  path: AbsolutePath.AbsolutePath,
  title: Schema.optionFromNullable(Schema.string),
  subtitle: Schema.optionFromNullable(Schema.string),
  content: Schema.string
}) {
  get forInsert() {
    return {
      ...this,
      contentHash: Hash.hash(this),
      embeddings: Option.none(),
      tokenCount: tokenizer.encode(this.fullContent).length
    }
  }

  get fullContent(): string {
    const titleMd = Option.match(this.title, {
      onNone: () => "",
      onSome: (_) => `# ${_}\n\n`
    })
    const subtitleMd = Option.match(this.subtitle, {
      onNone: () => "",
      onSome: (_) => `## ${_}\n\n`
    })
    return `${titleMd}${subtitleMd}${this.content}`
  }
}

export class DocumentChunk extends ParsedDocumentChunk.extend<DocumentChunk>()({
  id: Schema.number,
  contentHash: Schema.number,
  tokenCount: Schema.number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date
}) {}
