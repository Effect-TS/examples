import * as Debug from "effect/Debug";

Debug.runtimeDebug.traceExtractor = Debug.nodeSourceMapExtractor;
Debug.runtimeDebug.traceFilter = (trace) => trace.startsWith(__dirname);

import("./main");
