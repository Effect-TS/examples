import { Effect, Option } from 'effect'
import * as Http from '@effect/platform-node/HttpClient'
import * as Node from '@effect/platform-node/Runtime'
import * as Command from '@effect/cli/Command'
import * as Cli from '@effect/cli/CliApp'
import * as Options from '@effect/cli/Options'
import * as Args from '@effect/cli/Args'
import * as Schema from '@effect/schema/Schema'

const WttrWeatherSchema = Schema.struct({
  date: Schema.Date,
  avgtempC: Schema.NumberFromString,
  avgtempF: Schema.NumberFromString,
  maxtempC: Schema.NumberFromString,
  maxtempF: Schema.NumberFromString,
  mintempC: Schema.NumberFromString,
  mintempF: Schema.NumberFromString,
  sunHour: Schema.NumberFromString,
  uvIndex: Schema.NumberFromString,
})

const WttrResponseSchema = Schema.struct({ weather: Schema.array(WttrWeatherSchema) })

// Defines the command line interface for the `weather` command.
const cli = Cli.make({
  name: 'Weather',
  version: '1.2.3',
  command: Command.make('weather', {
    // Accept 0 or 1 arguments for the location and convert it to a `Option<string>`.
    args: Args.between(Args.text({ name: 'location' }), 0, 1).pipe(Args.map(Option.fromIterable)),
    options: Options.all({
      // Allow the user to override the default `wttr.in` service with the `--url` option.
      url: Options.withDefault(Options.text('url'), 'https://wttr.in'),
    }),
  }),
})

// Runs the previously defined command line interface with the given arguments.
const main = Cli.run(cli, process.argv.slice(2), ({ options, args }) =>
  // Based on the given options and arguments, you could invoke different (sub)commands here or
  // pass different parameters to your command function. In this example, we only have a single
  // command, so we just invoke it directly.
  Effect.gen(function* ($) {
    const httpClient = yield* $(Http.client.Client)

    // We're preparing a custom http client that will be used to send the request to the wttr.in service.
    const wttrClient = httpClient.pipe(
      // Always prepend the service url to all requests. This makes it more convenient to use the client.
      Http.client.mapRequest(Http.request.prependUrl(options.url)),
      // Tell the wttr.in service to return json.
      Http.client.mapRequest(Http.request.appendUrlParam('format', 'j1')),
      // Only accept responses with a `2xx` status code. Fail otherwise.
      Http.client.filterStatusOk,
      // Decode all responses using the `WttrResponseSchema` schema.
      Http.client.mapEffect(Http.response.schemaBodyJson(WttrResponseSchema)),
    )

    // Create the weather request for the provided location or the current location if none was provided.
    const wttrRequest = Option.match(args, {
      onNone: () => Http.request.get('/'),
      onSome: (_) => Http.request.get(`/${encodeURIComponent(_)}`),
    })

    // Send the request and wait for the response
    const wttrResponse = yield* $(wttrClient(wttrRequest))

    // TODO: Pretty print the weather.
    yield* $(Effect.log(wttrResponse.weather))
  }),
)

Node.runMain(main.pipe(
  // Provide the required layers (a.k.a. dependency injection).
  Effect.provideLayer(Http.client.layer),
  // Log any errors that occur during execution.
  Effect.tapErrorCause(Effect.logError),
))
