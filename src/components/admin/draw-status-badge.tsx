import { Badge } from "../ui/badge";
import {
  Gift,
  Ticket,
  Calendar,
  Edit,
  FileText,
  Clock,
  Loader2,
  Trophy,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export function getStatusBadge(status: string) {
  const config: Record<string, any> = {
    draft: { label: "Draft", variant: "secondary", icon: FileText },
    open: { label: "Open", variant: "default", icon: Ticket },
    closed: { label: "Closed", variant: "secondary", icon: Clock },
    drawing: { label: "Drawing", variant: "secondary", icon: Loader2 },
    completed: { label: "Completed", variant: "outline", icon: Trophy },
    cancelled: { label: "Cancelled", variant: "destructive", icon: X },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}
