import { Effect, Option, Cause, Layer } from 'effect'
import * as Http from '@effect/platform-node/HttpClient'
import * as Node from '@effect/platform-node/Runtime'
import * as Command from '@effect/cli/Command'
import * as Cli from '@effect/cli/CliApp'
import * as Options from '@effect/cli/Options'
import * as Args from '@effect/cli/Args'
import * as Console from '@effect/cli/Console'
import * as Wttr from './wttr'

const cli = Cli.make({
  name: 'Weather',
  version: '1.2.3',
  command: Command.make('weather', {
    args: Args.between(Args.text({ name: 'location' }), 0, 1),
    options: Options.all({
      url: Options.withDefault(Options.text('url'), 'https://wttr.in'),
    }),
  })
})

Node.runMain(Effect.sync(() => process.argv.slice(2)).pipe(
  Effect.flatMap((args) =>
    Cli.run(cli, args, ({ options, args }) => {
      const location = Option.fromIterable(args)
      const program = Wttr.Wttr.pipe(
        Effect.flatMap(wttr => wttr.getWeather(location)),
        // TODO: Render the output properly.
        Effect.tap(Effect.log),
      )

      const wttr = Layer.provide(Http.client.layer, Wttr.makeLayer(options.url))
      return Effect.provideLayer(program, wttr)
    })
  ),
  Effect.provideLayer(Console.layer),
  Effect.tapErrorCause((_) => Effect.logError(Cause.pretty(_)))
))
