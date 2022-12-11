import { useLoaderData as useLoaderDataRemix } from "@remix-run/react";
import type { Codec } from "effect/schema";

export { Effect } from "effect/io";
export { pipe } from "effect/data";
export { Chunk } from "effect/collection";
export { Codec } from "effect/schema";

export const useLoaderData = <A,>(type: Codec.Codec<A>) => {
  const data = useLoaderDataRemix();
  const parsed = type.decode(data);
  if (parsed._tag === "Left") {
    throw new Error(JSON.stringify(parsed.left));
  }
  return parsed.right;
};
