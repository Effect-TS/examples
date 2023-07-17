# Effect Starter

This code consists of three files:

1. `NameService.ts`: Defines the `NameService` interface and provides the live implementation of the `NameService` layer using `Layer.succeed`.

2. `program.ts`: Contains the main program logic that retrieves the name from the `NameService` and prints a greeting.

3. `index.ts`: Serves as the entry point of the application, where the `program` is provided with the `NameServiceLive` layer and executed using `Effect.runFork`.

These files demonstrate how to define a context using `Context.Tag`, implement a layer using `Layer.succeed`, and use the provided layer in the main program using `Effect.provideLayer`.

## Install & Run

Run `pnpm i` and `pnpm run start` to start the `src/index.ts` program.
