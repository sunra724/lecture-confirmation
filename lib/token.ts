import { randomUUID } from "node:crypto";

export function createToken() {
  return randomUUID();
}
