import { useLoaderData } from "@remix-run/react";

export { loader } from "./index.server";

export default function Index() {
  const { message } = useLoaderData();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <div>{message}</div>
    </div>
  );
}
