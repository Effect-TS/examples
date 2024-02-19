import * as FS from '@effect/platform/FileSystem'
import { runMain } from '@effect/platform-node/NodeRuntime'
import * as NodeContext from '@effect/platform-node/NodeContext'
import { Effect } from 'effect'

const main = Effect.gen(function* ($) {
  const fs = yield* $(FS.FileSystem)

  yield* $(fs.makeDirectory('output'))
  yield* $(fs.writeFileString('output/fs-write-file.txt', 'Hello World!'))

  console.log('Wrote file (output/fs-write-file.txt)')
})

runMain(main.pipe(Effect.provide(NodeContext.layer), Effect.tapErrorCause(Effect.log)))
