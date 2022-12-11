import { Codec, Remix, Effect, Chunk, pipe, RemixServer } from "~/utils";

export const data = Codec.struct({
  messages: Codec.chunk(Codec.string),
});

export const loader = RemixServer.makeLoader(data)(
  Effect.gen(function* ($) {
    const { pathname } = yield* $(RemixServer.requestURL);

    return {
      messages: Chunk.make(`hello world from ${pathname}`, `this is a complex data structure`),
    };
  })
);

export default function Index() {
  const { messages } = Remix.useLoaderData(data);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix, via babel & ts</h1>
      <>
        {pipe(
          messages,
          Chunk.mapWithIndex((message, index) => <div key={`message-${index}`}>{message}</div>)
        )}
      </>
    </div>
  );
}
