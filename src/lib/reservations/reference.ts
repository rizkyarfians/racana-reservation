import { customAlphabet } from "nanoid";

const randomReference = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function createReservationReference(date: string) {
  return `RCN-${date.replaceAll("-", "")}-${randomReference()}`;
}
