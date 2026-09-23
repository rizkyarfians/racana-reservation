"use client";

import type { ActionState } from "@/app/admin/actions";

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <p role="status" className={state.error ? "rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"}>
      {state.error ?? state.success}
    </p>
  );
}
