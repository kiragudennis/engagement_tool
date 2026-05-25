import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Gift,
  Ticket,
  Calendar,
  Edit,
  Eye,
  Trophy,
  Clock,
  Play,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getStatusBadge } from "./draw-status-badge";

export function DrawListItem({
  draw,
  stats,
  onUpdateStatus,
  onPerformDraw,
  onEdit,
}: any) {
  const isDrawTime = new Date(draw.draw_time) <= new Date();
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold">{draw.name}</h3>
              {getStatusBadge(draw.status)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {draw.prize_name}
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                {stats?.entries || 0} entries
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Draw: {format(new Date(draw.draw_time), "MMM d, HH:mm")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/draws/live/${draw.id}`} target="_blank">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/marketing/draws/${draw.id}/control`}>
                <Trophy className="h-4 w-4" />
              </Link>
            </Button>
            {draw.status === "closed" && isDrawTime && (
              <Button size="sm" onClick={() => onPerformDraw(draw.id)}>
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
