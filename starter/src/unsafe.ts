import { Effect, pipe } from "~/lib";
import { program } from "~/program";
import { NameServiceLive } from "~/services/name";

pipe(
  program,
  Effect.provideLayer(NameServiceLive),
  Effect.tapErrorCause(Effect.logErrorCause),
  Effect.runFork
);
