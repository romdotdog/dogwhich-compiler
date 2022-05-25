import { scratchId } from "./structure";

let counter = 24;
export function generateScratchId(): scratchId {
  counter++;
  return `Generated${counter}`;
}
