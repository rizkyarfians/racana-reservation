import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge variant="outline" className={cn("capitalize", status === "pending" && "border-amber-300 bg-amber-50 text-amber-800", status === "confirmed" && "border-emerald-300 bg-emerald-50 text-emerald-800", status === "rejected" && "border-rose-300 bg-rose-50 text-rose-800")}>{status === "confirmed" ? "Confirmed" : status === "rejected" ? "Rejected" : "Pending"}</Badge>;
}
