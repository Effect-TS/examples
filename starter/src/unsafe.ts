import { Effect } from "effect";
import { program } from "~/program";
import { NameServiceLive } from "~/services/name";

program.pipe(
  Effect.provideLayer(NameServiceLive),
  Effect.tapErrorCause(Effect.logCause({ level: "Error" })),
  Effect.runFork
);
