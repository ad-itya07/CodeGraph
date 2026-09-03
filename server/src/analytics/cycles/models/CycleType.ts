export type CycleType =
    | "file-import"  // File - File via IMPORTS
    | "symbol-call" // Symbol - Symbol via CALLS
    | "symbol-inheritance" // Symbol - Symbol via EXTENDS
    | "symbol-implementation" // Symbol - Symbol via IMPLEMENTS
    | "symbol-instantiation"; // Symbol - Symbol via INSTANTIATES