import * as Data from "effect/Data"
import type { Example } from "./internal/examples.js"
import type { Template } from "./internal/templates.js"

export type ProjectType = Data.TaggedEnum<{
  readonly Example: {
    readonly example: Example
  }
  readonly Template: {
    readonly template: Template
    readonly withChangesets: boolean
    readonly withNixFlake: boolean
    readonly withMadge: boolean
    readonly withPrettier: boolean
    readonly withESLint: boolean
    readonly withWorkflows: boolean
  }
}>

export const ProjectType = Data.taggedEnum<ProjectType>()
