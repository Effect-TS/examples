import * as FS from '@effect/platform/FileSystem'
import * as Node from '@effect/platform-node/Runtime'
import * as NodeContext from '@effect/platform-node/NodeContext'
import { Cause, Effect } from 'effect'

const main = Effect.gen(function* ($) {
  const fs = yield* $(FS.FileSystem)

  yield* $(fs.writeFileString('output/fs-write-file.txt', 'Hello World!'))

  console.log('Wrote file (output/fs-write-file.txt)')
})

Node.runMain(
  main.pipe(
    Effect.provideSomeLayer(NodeContext.layer),
    Effect.tapErrorCause((_) => Effect.log(Cause.pretty(_))),
  ),
)
