export type ProjectType = "basic" | "monorepo" | "cli"

export interface TemplateOptions {
  readonly projectName: string
  readonly projectType: ProjectType
}
