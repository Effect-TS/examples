import * as Debug from "effect/debug";

Debug.runtimeDebug.getCallTrace = Debug.getCallTraceFromNewError;
Debug.runtimeDebug.traceFilter = (trace) => trace.startsWith(__dirname);

import("./main");
