import { useLoaderData } from "@remix-run/react";
import { Effect } from "effect";
import { makeLoader, requestURL } from "~/runtime.server";

export const loader = makeLoader(
  Effect.gen(function* ($) {
    const { pathname, searchParams } = yield* $(requestURL);

    return yield* $(
      Effect.succeed({
        message: `hello world from ${pathname} (search: ${searchParams})`,
      })
    );
  })
);

export default function Index() {
  const { message } = useLoaderData();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <div>{message}</div>
    </div>
  );
}
