import * as Debug from "npm:@effect/io/Debug";

Debug.runtimeDebug.minumumLogLevel = "Debug";
Debug.runtimeDebug.traceExecutionLogEnabled = true;
Debug.runtimeDebug.getCallTrace = Debug.getCallTraceFromNewError;
Debug.runtimeDebug.traceFilter = (trace) => !trace.includes(".deno");
