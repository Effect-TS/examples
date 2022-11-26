import { runtimeDebug } from "effect/Debug";

runtimeDebug.traceExecutionLogEnabled = true;
runtimeDebug.logLevelOverride = "Debug";

import("./main");
