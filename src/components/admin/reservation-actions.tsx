"use client";

import { useActionState, useState } from "react";

import { changeStatusAction } from "@/app/admin/actions";
import { ActionMessage } from "@/components/admin/action-message";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReservationActions({ id, compact = false }: { id: string; compact?: boolean }) {
  const [approveState, approveAction, approvePending] = useActionState(changeStatusAction, {});
  const [rejectState, rejectAction, rejectPending] = useActionState(changeStatusAction, {});
  const [open, setOpen] = useState(false);

  return <div className="space-y-3"><div className="flex flex-wrap gap-2"><form action={approveAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="confirmed" /><Button type="submit" size={compact ? "sm" : "default"} disabled={approvePending}>{approvePending ? "Approving…" : "Approve"}</Button></form><Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" size={compact ? "sm" : "default"} />}>Reject</DialogTrigger><DialogContent><form action={rejectAction} onSubmit={() => setTimeout(() => setOpen(false), 250)}><DialogHeader><DialogTitle>Reject this request?</DialogTitle><DialogDescription>The customer will receive your reason by email. This action releases the held capacity and cannot be reversed.</DialogDescription></DialogHeader><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="rejected" /><div className="my-5"><Label htmlFor={`reason-${id}`}>Reason for rejection</Label><Textarea id={`reason-${id}`} name="rejectionReason" required minLength={3} maxLength={1000} className="mt-2" placeholder="Let the customer know why this request cannot be accommodated." /></div><ActionMessage state={rejectState} /><DialogFooter className="mt-5"><DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose><Button type="submit" variant="destructive" disabled={rejectPending}>{rejectPending ? "Rejecting…" : "Reject request"}</Button></DialogFooter></form></DialogContent></Dialog></div><ActionMessage state={approveState} /></div>;
}
