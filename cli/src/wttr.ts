import { Effect, Data, Context, Layer, Option } from 'effect'
import * as Http from '@effect/platform/HttpClient'
import * as Schema from '@effect/schema/Schema'

type WttrWeather = Schema.Schema.To<typeof WttrWeatherSchema>
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

class WttrError extends Data.TaggedClass('WttrError')<{
  cause: unknown
}> {}

export const Wttr = Context.Tag<Wttr>()
export interface Wttr {
  readonly getWeather: (location: Option.Option<string>) => Effect.Effect<never, WttrError, ReadonlyArray<WttrWeather>>
}

export const makeLayer = (url: string) => Layer.effect(Wttr, Effect.gen(function* ($) {
  const defaultClient = yield* $(Http.client.Client)
  const wttrClient = defaultClient.pipe(
    Http.client.mapRequest(Http.request.prependUrl(url)),
    Http.client.mapRequest(Http.request.appendUrlParam('format', 'j1')),
    Http.client.filterStatusOk,
    Http.client.mapEffect(Http.response.schemaBodyJson(WttrResponseSchema)),
    Http.client.catchTags({
      'RequestError': (cause) => Effect.fail(new WttrError({ cause })),
      'ResponseError': (cause) => Effect.fail(new WttrError({ cause })),
      'ParseError': (cause) => Effect.fail(new WttrError({ cause })),
    }),
  )

  return Wttr.of({
    getWeather: (location) => Option.match(location, {
      onNone: () => Http.request.get('/'),
      onSome: (_) => Http.request.get(`/${encodeURIComponent(_)}`),
    }).pipe(wttrClient, Effect.map(_ => _.weather)),
  })
}))
