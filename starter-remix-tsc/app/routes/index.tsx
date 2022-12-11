import * as _ from "~/utils";

export const data = _.Codec.struct({
  messages: _.Codec.chunk(_.Codec.string),
});

export const loader = _.makeLoader(data)(
  _.Effect.gen(function* ($) {
    const { pathname } = yield* $(_.requestURL);

    return {
      messages: _.Chunk.make(
        `hello world from ${pathname}`,
        `this is a complex data structure`
      ),
    };
  })
);

export default function Index() {
  const { messages } = _.useLoaderData(data);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix, via babel & ts</h1>
      <>
        {_.pipe(
          messages,
          _.Chunk.mapWithIndex((message, index) => (
            <div key={`message-${index}`}>{message}</div>
          ))
        )}
      </>
    </div>
  );
}
