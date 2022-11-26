# Effect Starter

This project is a quick-start that uses the standard TS+ compiler together with the `@effect/language-service` plugin to improve developer experience and to optimize the code by also adding compile time traces required for debugging errors efficiently in production.

## One Click
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/effect-ts/examples/tree/main/starter-traced?file=src%2Fmain.ts)

## Install & Run

Run `yarn install` and `yarn run start` to start the `src/main.ts` program.

Note: there is no need for a debug mode as the normal run is already traced. If a debug mode is configured, like in the `starter` project it will take over tracing as it is more precised compared to the plugin based one at the price of being expensive performance wise.

In this case the `main.debug.ts` script is used to enable execution logging, a feature that enables debug log of every operation encountered by the runtime.