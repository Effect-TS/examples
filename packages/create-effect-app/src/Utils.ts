import * as HelpDoc from "@effect/cli/HelpDoc"
import * as Effect from "effect/Effect"

const SCOPED_PACKAGE_REGEX = /^(?:@([^/]+?)[/])?([^/]+?)$/

const blockList = [
  "node_modules",
  "favicon.ico"
]

// Generated with node -e 'console.log(require("module").builtinModules)'
const nodeBuiltins = [
  "_http_agent",
  "_http_client",
  "_http_common",
  "_http_incoming",
  "_http_outgoing",
  "_http_server",
  "_stream_duplex",
  "_stream_passthrough",
  "_stream_readable",
  "_stream_transform",
  "_stream_wrap",
  "_stream_writable",
  "_tls_common",
  "_tls_wrap",
  "assert",
  "assert/strict",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "dns/promises",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "inspector",
  "inspector/promises",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "readline/promises",
  "repl",
  "stream",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "timers",
  "timers/promises",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib"
]

const invalid = (message: string) => Effect.fail(HelpDoc.p(message))

export function validateProjectName(name: string): Effect.Effect<string, HelpDoc.HelpDoc> {
  if (name.length === 0) {
    return invalid("Project name must be a non-empty string")
  }
  if (name.length > 214) {
    return invalid("Project name must not contain more than 214 characters")
  }
  if (name.toLowerCase() !== name) {
    return invalid("Project name must not contain capital letters")
  }
  if (name.trim() !== name) {
    return invalid("Project name must not contain leading or trailing whitespace")
  }
  if (name.match(/^\./)) {
    return invalid("Project name must not start with a period")
  }
  if (name.match(/^_/)) {
    return invalid("Project name must not start with an underscore")
  }
  if (/[~'!()*]/.test(name.split("/").slice(-1)[0])) {
    return invalid("Project name must not contain the special scharacters ~'!()*")
  }
  const isNodeBuiltin = nodeBuiltins.some((builtinName) => {
    return name.toLowerCase() === builtinName
  })
  if (isNodeBuiltin) {
    return invalid("Project name must not be a NodeJS built-in module name")
  }
  const isBlockedName = blockList.some((blockedName) => {
    return name.toLowerCase() === blockedName
  })
  if (isBlockedName) {
    return invalid(`Project name '${name}' is blocked from use`)
  }
  if (encodeURIComponent(name) !== name) {
    // Check scoped packages
    const result = name.match(SCOPED_PACKAGE_REGEX)
    if (result) {
      const user = result[1]
      const pkg = result[2]
      if (encodeURIComponent(user) !== user || encodeURIComponent(pkg) !== pkg) {
        return invalid("Project name must only contain URL-friendly characters")
      }
    }
  }
  return Effect.succeed(name)
}
