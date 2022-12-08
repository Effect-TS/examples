import type { LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Effect } from "~/utils.server";
import { makeLoader, requestURL } from "~/runtime.server";

export const loader = (data: LoaderArgs) => makeLoader(data)(
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
      <h1>Welcome to Remix</h1>
      <div>{message}</div>
    </div>
  );
}
