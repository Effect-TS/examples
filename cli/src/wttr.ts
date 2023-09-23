import { Effect, Option, Cause } from 'effect'
import * as Http from '@effect/platform-node/HttpClient'
import * as Node from '@effect/platform-node/Runtime'
import * as Command from '@effect/cli/Command'
import * as Cli from '@effect/cli/CliApp'
import * as Options from '@effect/cli/Options'
import * as Args from '@effect/cli/Args'
import * as Console from '@effect/cli/Console'
import * as Schema from '@effect/schema/Schema'

const WttrWeatherSchema = Schema.struct({
  date: Schema.dateFromString(Schema.string),
  avgtempC: Schema.numberFromString(Schema.string),
  avgtempF: Schema.numberFromString(Schema.string),
  maxtempC: Schema.numberFromString(Schema.string),
  maxtempF: Schema.numberFromString(Schema.string),
  mintempC: Schema.numberFromString(Schema.string),
  mintempF: Schema.numberFromString(Schema.string),
  sunHour: Schema.numberFromString(Schema.string),
  uvIndex: Schema.numberFromString(Schema.string)
})

const WttrResponseSchema = Schema.struct({
  weather: Schema.array(WttrWeatherSchema)
})

const cli = Cli.make({
  name: 'Weather',
  version: '1.2.3',
  command: Command.make('weather', {
    // Accept 0 or 1 arguments for the location and convert it to a `Option<string>`.
    args: Args.between(Args.text({ name: 'location' }), 0, 1).pipe(Args.map(Option.fromIterable)),
    options: Options.all({
      url: Options.withDefault(Options.text('url'), 'https://wttr.in'),
    }),
  })
})

Node.runMain(Effect.sync(() => process.argv.slice(2)).pipe(
  Effect.flatMap((args) =>
    Cli.run(cli, args, ({ options: { url }, args: location }) => {
      const program = Effect.gen(function* ($) {
        const defaultClient = yield* $(Http.client.Client)
        const wttrClient = defaultClient.pipe(
          // Always prepend the service url to all requests. This makes it more convenient to use the client.
          Http.client.mapRequest(Http.request.prependUrl(url)),
          // Tell the wttr.in service to return json.
          Http.client.mapRequest(Http.request.appendUrlParam('format', 'j1')),
          // Only accept status responses with a `2xx` status code. Fail otherwise.
          Http.client.filterStatusOk,
          // Decode all responses using the `WttrResponseSchema` schema.
          Http.client.mapEffect(Http.response.schemaBodyJson(WttrResponseSchema)),
        );

        // Request the weather for the provided location or the current location if none was provided.
        const wttrResponse = yield* $(Option.match(location, {
          onNone: () => Http.request.get('/'),
          onSome: (_) => Http.request.get(`/${encodeURIComponent(_)}`),
        }).pipe(wttrClient, Effect.map(_ => _.weather)));

        // TODO: Pretty print the weather.
        yield* $(Effect.log(wttrResponse));
      });

      return Effect.provideLayer(program, Http.client.layer)
    })
  ),
  Effect.provideLayer(Console.layer),
  Effect.tapErrorCause((_) => Effect.logError(Cause.pretty(_)))
))
