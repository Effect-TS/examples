import { useLoaderData as useLoaderDataRemix } from "@remix-run/react";
import type { Type } from "io-ts";
import rep from "io-ts-reporters";

export const useLoaderData = <A, O, I>(type: Type<A, O, I>) => {
  const data = useLoaderDataRemix();
  const parsed = type.decode(data);
  if (parsed._tag === "Left") {
    throw new Error(rep.report(parsed).join("\r\n"));
  }
  return parsed.right;
};
