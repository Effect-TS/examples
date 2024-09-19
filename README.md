[![Nightly Build](https://github.com/Effect-TS/examples/workflows/Nightly%20Checks/badge.svg)](https://github.com/Effect-TS/examples/actions)

# Effect Examples

## Create Effect App

The easiest way to get started with Effect is by using `create-effect-app`.

This CLI tool enables you to quickly bootstrap a project with Effect, with everything pre-configured for you.

You can create a new project using one of our [project templates](./templates) or by using one of the [official Effect examples](./examples).

See [the documentation](./packages/create-effect-app/README.md) for more information.

## Examples

This repository contains examples which can be used to understand how to use Effect. You can also clone an example to your local machine via the `create-effect-app` CLI tool.

The available examples include:

|Name|Description|
|----|----|
|`http-server`| An HTTP server built with Effect complete with authentication and authorization. |

## Templates

This repository contains templates which can be used to quickly bootstrap a new project with Effect via the `create-effect-app` CLI tool.

These templates were developed to mirror the project configuration recommneded by the Effect core team and are thus somewhat opinionated.

### Basic

The `basic` template is meant to serve as the foundation for building a single package or library with Effect.

The template features:

- Pre-configured build pipeline which supports both ESM and CJS
- Pre-configured test pipeline via `vitest`
- Pre-configured TypeScript configuration
- ESLint & Dprint for linting and formatting, respectively (optional)
- Nix to provide a consistent development shell (optional)
- Changesets for version management and publication (optional)
- The Effect team's recommended GitHub Actions (optional)

For more information, see the template [README](./templates/basic/README.md).

### Monorepo

The `monorepo` template is meant to serve as the foundation for building multiple packages or applications with Effect.

The template features everything included with the `basic` template in addition to:

- Pre-configured TypeScript path aliases and project references to support package interdependencies

For more information, see the template [README](./templates/monorepo/README.md).

### CLI

The `cli` template is meant to serve as the foundation for building a command-line application with [Effect CLI](https://github.com/Effect-TS/effect/blob/main/packages/cli/README.md).

The template features everything included with the `basic` template, except with a different build pipeline:

- Pre-configured build pipeline is via [`tsup`](https://github.com/egoist/tsup) to support bundling to a single file

For more information, see the template [README](./templates/cli/README.md).
