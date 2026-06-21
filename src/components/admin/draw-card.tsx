import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { getStatusBadge } from "./draw-status-badge";
import {
  Gift,
  Target,
  Users,
  Share2,
  Radio,
  Crown,
  Coins,
  Clock,
  Play,
  Eye,
  Trophy,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "../ui/button";

export function DrawCard({
  draw,
  stats,
  onUpdateStatus,
  onPerformDraw,
  onEdit,
}: any) {
  const isEntryOpen =
    new Date(draw.entry_starts_at) <= new Date() &&
    new Date(draw.entry_ends_at) >= new Date();
  const isDrawTime = new Date(draw.draw_time) <= new Date();
  const progress = draw.max_entries_total
    ? (stats?.entries / draw.max_entries_total) * 100
    : null;
  const isExpiringSoon =
    new Date(draw.entry_ends_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
      {progress !== null && (
        <div className="absolute top-0 left-0 right-0">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      )}

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              {draw.name}
              {getStatusBadge(draw.status)}
              {isExpiringSoon && draw.status === "open" && (
                <Badge
                  variant="outline"
                  className="bg-orange-500/10 text-orange-500 border-orange-500/30"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Ending Soon
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {draw.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prize Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
          <Gift className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">{draw.prize_name}</p>
            {draw.prize_value && (
              <p className="text-sm text-muted-foreground">
                KES {draw.prize_value.toLocaleString()}
              </p>
            )}
          </div>
          {draw.consolation_points_amount > 0 && (
            <Badge variant="outline" className="gap-1">
              <Coins className="h-3 w-3" />
              {draw.consolation_points_amount} pts consolation
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats?.entries || 0}</p>
            <p className="text-xs text-muted-foreground">Entries</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats?.participants || 0}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats?.winners || 0}</p>
            <p className="text-xs text-muted-foreground">Winners</p>
          </div>
        </div>

        {/* Entry Methods */}
        <div className="flex flex-wrap gap-1">
          {draw.entry_config?.purchase && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              Purchase
            </Badge>
          )}
          {draw.entry_config?.referral && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              Referral
            </Badge>
          )}
          {draw.entry_config?.social_share && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Share2 className="h-3 w-3" />
              Social Share
            </Badge>
          )}
          {draw.entry_config?.live_stream && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Radio className="h-3 w-3" />
              Live Stream
            </Badge>
          )}
          {draw.entry_config?.loyalty_tier && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Crown className="h-3 w-3" />
              Loyalty Bonus
            </Badge>
          )}
        </div>

        {/* Timing */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entries Open:</span>
            <span>
              {format(new Date(draw.entry_starts_at), "MMM d, HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entries Close:</span>
            <span
              className={isExpiringSoon ? "text-orange-500 font-medium" : ""}
            >
              {format(new Date(draw.entry_ends_at), "MMM d, HH:mm")}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Draw Time:</span>
            <span>{format(new Date(draw.draw_time), "MMM d, HH:mm")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link
              href={
                draw.business_slug
                  ? `/${draw.business_slug}/draw/${draw.id}/live`
                  : `#`
              }
              target="_blank"
            >
              <Eye className="h-4 w-4 mr-2" />
              Live View
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/admin/marketing/draws/${draw.id}/control`}>
              <Trophy className="h-4 w-4 mr-2" />
              Control
            </Link>
          </Button>
        </div>

        {/* Status-specific actions */}
        {draw.status === "draft" && isEntryOpen && (
          <Button
            className="w-full"
            onClick={() => onUpdateStatus(draw.id, "open")}
          >
            <Ticket className="h-4 w-4 mr-2" />
            Open for Entries
          </Button>
        )}

        {draw.status === "open" &&
          new Date(draw.entry_ends_at) < new Date() && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onUpdateStatus(draw.id, "closed")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Close Entries
            </Button>
          )}

        {draw.status === "closed" && isDrawTime && (
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={() => onPerformDraw(draw.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Perform Draw
          </Button>
        )}

        {draw.status === "completed" && draw.winner_id && (
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/admin/marketing/draws/${draw.id}/winners`}>
              <Trophy className="h-4 w-4 mr-2" />
              View Winners
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
