import { Effect } from "effect/io";
import { Codec } from "effect/schema";
import { useLoaderData } from "~/utils";
import { makeLoader, requestURL } from "~/utils.server";

export const data = Codec.struct({
  message: Codec.string,
});

export const loader = makeLoader(data)(
  Effect.gen(function* ($) {
    const { pathname } = yield* $(requestURL);

    return {
      message: `hello world from ${pathname}`,
    };
  })
);

export default function Index() {
  const { message } = useLoaderData(data);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix, via babel & ts</h1>
      <div>{message}</div>
    </div>
  );
}
