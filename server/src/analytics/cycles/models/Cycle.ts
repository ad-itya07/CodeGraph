import { CycleType } from "./CycleType.js";

export interface Cycle {
    type: CycleType;
    nodeIds: string[];
}