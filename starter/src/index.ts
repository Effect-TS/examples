import { Effect } from "effect";
import { program } from "~/program";
import { NameServiceLive } from "~/NameService";

/**
 * Entry point of the application
 */

// Effect<never, never, void>
const main = Effect.provide(program, NameServiceLive);

Effect.runFork(main);
