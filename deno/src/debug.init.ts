import * as Debug from 'npm:@effect/io/Debug';

Debug.runtimeDebug.getCallTrace = Debug.getCallTraceFromNewError;
Debug.runtimeDebug.traceFilter = (trace) => !trace.includes('.cache');
