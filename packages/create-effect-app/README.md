# Create Effect App

The `create-effect-app` command-line application is a tool which allows you to quickly bootstrap new Effect applications from either a template or from an official Effect example application.

## Getting Started

There are two main ways to use `create-effect-app`:

### Interactive

The easiest way to use `create-effect-app` is interactively via your preferred package manager:

*`npm`*

```sh
npx create-effect-app [project-name]
```

*`pnpm`*

```sh
pnpm create effect-app [project-name]
```

*`yarn`*

```sh
yarn create effect-app [project-name]
```

*`bun`*

```sh
bunx create-effect-app [project-name]
```

You will then be prompted to select the type of project you want to create and customize your project with additional options (see the full [usage](#usage) documentation below).

### Non-Interactive

You can also invoke the `create-effect-app` CLI non-interactively:

#### Usage

```sh
Create Effect App

USAGE

$ create-effect-app [(-t, --template basic | cli | monorepo) [--changesets] [--flake] [--eslint] [--workflows]] [<project-name>]

$ create-effect-app [(-e, --example http-server)] [<project-name>]

DESCRIPTION

Create an Effect application from an example or a template repository

ARGUMENTS

<project-name>

  A directory that must not exist.

  The folder to output the Effect application code into

  This setting is optional.

OPTIONS

(-e, --example http-server)

  One of the following: http-server

  The name of an official Effect example to use to bootstrap the application

(-t, --template basic | cli | monorepo)

  One of the following: basic, cli, monorepo

  The name of an official Effect example to use to bootstrap the application

--changesets

  A true or false value.

  Initialize project with Changesets

  This setting is optional.

--flake

  A true or false value.

  Initialize project with a Nix flake

  This setting is optional.

--eslint

  A true or false value.

  Initialize project with ESLint

  This setting is optional.

--workflows

  A true or false value.

  Initialize project with Effect's recommended GitHub actions

  This setting is optional.
```
