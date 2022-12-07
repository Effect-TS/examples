import { runtimeDebug } from "effect/debug";

runtimeDebug.traceExecutionLogEnabled = true;
runtimeDebug.defaultLogLevel = "Debug";

import("./main");
