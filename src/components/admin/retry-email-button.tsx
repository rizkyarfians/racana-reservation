"use client";

import { useActionState } from "react";

import { retryEmailAction } from "@/app/admin/actions";
import { ActionMessage } from "@/components/admin/action-message";
import { Button } from "@/components/ui/button";

export function RetryEmailButton({ deliveryId, reservationId }: { deliveryId: string; reservationId: string }) {
  const [state, action, pending] = useActionState(retryEmailAction, {});
  return <div><form action={action}><input type="hidden" name="deliveryId" value={deliveryId} /><input type="hidden" name="reservationId" value={reservationId} /><Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Retrying…" : "Retry email"}</Button></form><div className="mt-2"><ActionMessage state={state} /></div></div>;
}
