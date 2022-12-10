import { useLoaderData } from "@remix-run/react";
import { Effect } from "effect/io";
import { makeLoader, requestURL } from "~/utils";

export const loader = makeLoader(
  Effect.gen(function* ($) {
    const { pathname } = yield* $(requestURL);

    return yield* $(
      Effect.succeed({ message: `hello world from ${pathname}` })
    );
  })
);

export default function Index() {
  const { message } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix, via babel</h1>
      <div>{message}</div>
    </div>
  );
}
