import { Effect, pipe } from "effect";
import { program } from "~/program";
import { NameServiceLive } from "~/services/name";

pipe(
  program,
  Effect.provideLayer(NameServiceLive),
  Effect.tapErrorCause(Effect.logCause({ level: "Error" })),
  Effect.runFork
);
