export function privateRuntimeEvent(line:string):Record<string,any>|null;
export function summarizeRuntimeEvents(events:Array<Record<string,any>>,options?:{memoryMiB?:number|null}):Record<string,any>;
