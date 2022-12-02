import { useLoaderData } from "@remix-run/react";
import { Effect } from "effect";
import { makeLoader } from "~/runtime.server";

export const loader = makeLoader((_) => Effect.gen(function* ($) {
  return yield* $(Effect.succeed({
    message: "hello world"
  }))
}))

export default function Index() {
  const data = useLoaderData();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <div>{JSON.stringify(data)}</div>
    </div>
  );
}
