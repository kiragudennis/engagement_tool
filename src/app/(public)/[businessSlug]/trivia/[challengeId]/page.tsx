// app/(public)/[businessSlug]/trivia/[challengeId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Brain,
  CheckCircle,
  XCircle,
  Timer,
  Lightbulb,
  Users,
  Trophy,
  Loader2,
  Crown,
  Send,
  Ticket,
  Clock,
  Zap,
  Flame,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSocket } from "@/lib/socket/useSocket";

// ─── Types ──────────────────────────────────────────────
interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  difficulty: string;
  points_value: number;
  time_limit_seconds: number;
  question_type: string;
  accepted_answers?: string[];
  explanation?: string;
}

interface TriviaSelection {
  id: string;
  user_id: string;
  question_id: string;
  status:
    | "queued"
    | "current"
    | "answered"
    | "timeout"
    | "passed"
    | "eliminated";
  selected_answer?: number;
  is_correct?: boolean;
  points_earned?: number;
  question_shown_at: string;
}

interface TriviaScore {
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  fastest_response_ms?: number;
}

interface QueueStatus {
  ticket_number: number;
  user_name: string;
  queue_position: number;
  is_active: boolean;
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  current_status: string;
}

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  brand_secondary_color: string;
}

// ─── Main Component ─────────────────────────────────────
export default function BusinessTriviaPage() {
  const { businessSlug, challengeId } = useParams<{
    businessSlug: string;
    challengeId: string;
  }>();
  const { supabase, profile } = useAuth();
  const router = useRouter();

  // Business & Challenge state
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Game state
  const [mySelection, setMySelection] = useState<TriviaSelection | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(
    null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [isEliminated, setIsEliminated] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(null);

  // Score and queue
  const [myScore, setMyScore] = useState<TriviaScore | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [queueParticipants, setQueueParticipants] = useState<QueueStatus[]>([]);
  const [currentAnsweringUser, setCurrentAnsweringUser] = useState<{
    user_name: string;
    ticket_number: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isMyTurn = mySelection?.status === "current";
  const hasAnswered =
    mySelection?.status === "answered" || mySelection?.status === "timeout";

  // ─── Loaders ──────────────────────────────────────────
  const loadBusinessAndChallenge = useCallback(async () => {
    if (!businessSlug || !supabase) return;

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, slug, logo_url, brand_color, brand_secondary_color")
      .eq("slug", businessSlug)
      .single();

    if (!biz) {
      router.push("/spin");
      return;
    }
    setBusiness(biz);

    // Find active trivia challenge for this business
    const { data: ch } = await supabase
      .from("challenges")
      .select("*")
      .eq("business_id", biz.id)
      .eq("challenge_type", "trivia")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (ch) setChallenge(ch);

    // Check if user is a participant
    if (profile?.id) {
      const { data: part } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", ch?.id)
        .eq("user_id", profile.id)
        .maybeSingle();
      setParticipant(part);
    }
  }, [businessSlug, supabase, profile?.id, router]);

  const loadQuestion = async (questionId: string) => {
    const { data } = await supabase
      .from("challenge_trivia_questions")
      .select("*")
      .eq("id", questionId)
      .single();
    if (data) setCurrentQuestion(data);
    return data;
  };

  const loadLeaderboard = async () => {
    if (!challenge?.id) return;
    const { data } = await supabase.rpc("get_trivia_leaderboard", {
      p_challenge_id: challenge.id,
      p_limit: 20,
    });
    setLeaderboard(data || []);
  };

  const loadMyScore = async () => {
    if (!profile?.id || !challenge?.id) return;
    const { data } = await supabase
      .from("challenge_trivia_scores")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (data) setMyScore(data);
  };

  const loadQueueStatus = async () => {
    if (!challenge?.id) return;
    const { data } = await supabase.rpc("get_trivia_queue_status", {
      p_challenge_id: challenge.id,
    });
    if (data) {
      setQueueParticipants(data);
      const answering = data.find(
        (p: QueueStatus) => p.current_status === "answering",
      );
      if (answering) {
        setCurrentAnsweringUser({
          user_name: answering.user_name,
          ticket_number: answering.ticket_number,
        });
      } else {
        setCurrentAnsweringUser(null);
      }
    }
  };

  // ─── Initial Load ─────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await loadBusinessAndChallenge();
      setInitialLoading(false);
    };
    init();
  }, [loadBusinessAndChallenge]);

  // Load game data once challenge is known
  useEffect(() => {
    if (!challenge?.id || !profile?.id) return;

    const initGame = async () => {
      // Check elimination
      const { data: elimCheck } = await supabase
        .from("challenge_trivia_selections")
        .select("status")
        .eq("challenge_id", challenge.id)
        .eq("user_id", profile.id)
        .eq("status", "eliminated")
        .limit(1);
      if (elimCheck?.length) {
        setIsEliminated(true);
        return;
      }

      // Check for active selection
      const { data: activeSelection } = await supabase
        .from("challenge_trivia_selections")
        .select("*")
        .eq("challenge_id", challenge.id)
        .eq("user_id", profile.id)
        .in("status", ["current", "answered", "timeout"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSelection) {
        setMySelection(activeSelection);
        const qData = await loadQuestion(activeSelection.question_id);

        if (activeSelection.status === "current") {
          setTimerActive(true);
          const shownAt = new Date(activeSelection.question_shown_at).getTime();
          const timeLimit = (qData?.time_limit_seconds || 5) * 1000;
          const elapsed = Date.now() - shownAt;
          setTimeLeft(Math.max(0, Math.ceil((timeLimit - elapsed) / 1000)));
        } else {
          setSelectedAnswer(activeSelection.selected_answer);
          setAnswerResult({
            is_correct: activeSelection.is_correct,
            points_earned: activeSelection.points_earned,
          });
        }
      }

      await Promise.all([loadLeaderboard(), loadQueueStatus(), loadMyScore()]);
    };

    initGame();
  }, [challenge?.id, profile?.id]);

  // ─── Real-time ────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id || !challenge?.id) return;

    const channel = supabase
      .channel(`trivia-${challenge.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_trivia_selections",
          filter: `challenge_id=eq.${challenge.id}`,
        },
        async (payload) => {
          const sel = payload.new as TriviaSelection;
          loadQueueStatus();

          if (sel.user_id === profile.id) {
            setMySelection(sel);
            const qData = await loadQuestion(sel.question_id);
            setSelectedAnswer(null);
            setTextAnswer("");
            setAnswerResult(null);
            setTimerActive(true);
            setTimeLeft(qData?.time_limit_seconds || 5);
            toast.success("You've been selected! Answer quickly!");
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenge_trivia_selections",
          filter: `challenge_id=eq.${challenge.id}`,
        },
        async (payload) => {
          const sel = payload.new as TriviaSelection;
          loadQueueStatus();
          loadLeaderboard();

          if (sel.user_id === profile.id) {
            setMySelection(sel);
            if (sel.status === "answered") {
              setTimerActive(false);
              setSelectedAnswer(sel.selected_answer!);
              setAnswerResult({
                is_correct: sel.is_correct,
                points_earned: sel.points_earned,
              });
              loadMyScore();
              if (sel.is_correct)
                toast.success(`+${sel.points_earned} points!`);
            } else if (sel.status === "timeout") {
              setTimerActive(false);
              setAnswerResult({ is_correct: false, points_earned: 0 });
            } else if (sel.status === "passed") {
              setTimerActive(false);
              setMySelection(null);
              setCurrentQuestion(null);
              toast.info("Question passed to next player");
            } else if (sel.status === "eliminated") {
              setIsEliminated(true);
              toast.error("You've been eliminated");
            }
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [challenge?.id, profile?.id]);

  // ─── Socket real-time (offload Supabase) ────────────────
  const { on: onSocket, emit: emitSocket } = useSocket();

  useEffect(() => {
    if (!challenge?.id) return;

    emitSocket("join:trivia-queue", challenge.id);

    const unsub1 = onSocket("trivia:queue:called", (data: any) => {
      setCurrentAnsweringUser({
        user_name: data.user_name,
        ticket_number: data.ticket_number,
      });
      loadQueueStatus();
    });

    const unsub2 = onSocket("trivia:queue:skipped", () => {
      setCurrentAnsweringUser(null);
      loadQueueStatus();
    });

    const unsub3 = onSocket("trivia:queue:update", () => {
      loadQueueStatus();
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [challenge?.id, onSocket, emitSocket, loadQueueStatus]);

  // ─── Timer ────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeLeft]);

  // ─── Answer Handlers ──────────────────────────────────
  const handleMultipleChoiceAnswer = async (answerIndex: number) => {
    if (!isMyTurn || selectedAnswer !== null || isSubmitting || !mySelection)
      return;
    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_trivia_answer", {
        p_selection_id: mySelection.id,
        p_answer_index: answerIndex,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEndedAnswer = async () => {
    if (!isMyTurn || isSubmitting || !mySelection || !textAnswer.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_trivia_answer", {
        p_selection_id: mySelection.id,
        p_text_answer: textAnswer.trim(),
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandColor = business?.brand_color || "#8B5CF6";

  // ─── Loading ──────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-20 w-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Loading Trivia</h2>
        </div>
      </div>
    );
  }

  if (!business || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-black/50 border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              No Active Trivia
            </h2>
            <p className="text-white/50 mb-4">
              {business?.name} hasn't started a trivia challenge yet.
            </p>
            <Button asChild style={{ backgroundColor: brandColor }}>
              <Link href={`/${businessSlug}/spin`}>Go to Spin & Win</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Not a participant ────────────────────────────────
  if (!participant && profile?.id && !isEliminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-black/50 border-white/10 max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Ticket className="h-16 w-16 text-white/20 mx-auto" />
            <h2 className="text-xl font-bold text-white">Not in the Queue</h2>
            <p className="text-white/50">
              You need a trivia ticket to participate. Spin the wheel for a
              chance to win one!
            </p>
            <Button
              asChild
              className="w-full"
              style={{ backgroundColor: brandColor }}
            >
              <Link href={`/${businessSlug}/spin`}>
                <Zap className="h-4 w-4 mr-2" /> Spin to Win a Ticket
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Eliminated ───────────────────────────────────────
  if (isEliminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-red-950/30 border-red-500/30 max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Eliminated</h2>
            <p className="text-red-300 mb-4">Better luck next time!</p>
            {myScore && (
              <p className="text-yellow-400 text-2xl font-bold">
                Final Score: {myScore.total_score}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRank = leaderboard.findIndex((e) => e.user_id === profile?.id) + 1;

  // ─── Main Render ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 border-b border-purple-500/20 bg-purple-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brandColor }}
              >
                {business.name[0]}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {business.name} Trivia
                </h1>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isMyTurn ? "bg-green-500 animate-pulse" : "bg-blue-500",
                    )}
                  />
                  <span className="text-xs text-gray-400">
                    {isMyTurn
                      ? "YOUR TURN!"
                      : hasAnswered
                        ? "Answer submitted"
                        : "Waiting for turn"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {myScore && (
                <Badge className="bg-yellow-500/20 text-yellow-400">
                  <Trophy className="h-3 w-3 mr-1" />
                  {myScore.total_score} pts
                </Badge>
              )}
              {userRank > 0 && (
                <Badge className="bg-purple-500/20 text-purple-400">
                  <Crown className="h-3 w-3 mr-1" />#{userRank}
                </Badge>
              )}
              {participant?.ticket_number && (
                <Badge
                  style={{
                    backgroundColor: `${brandColor}30`,
                    color: brandColor,
                  }}
                >
                  <Ticket className="h-3 w-3 mr-1" />#
                  {participant.ticket_number}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Queue */}
          <div className="lg:col-span-1 space-y-4">
            {/* My Stats */}
            {myScore && (
              <Card className="bg-white/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <MiniStatBox
                      label="Score"
                      value={myScore.total_score}
                      color="text-yellow-400"
                      bg="bg-yellow-500/10"
                    />
                    <MiniStatBox
                      label="Correct"
                      value={`${myScore.correct_answers}/${myScore.questions_answered}`}
                      color="text-green-400"
                      bg="bg-green-500/10"
                    />
                    <MiniStatBox
                      label="Accuracy"
                      value={`${myScore.accuracy}%`}
                      color="text-blue-400"
                      bg="bg-blue-500/10"
                    />
                    <MiniStatBox
                      label="Streak"
                      value={`${myScore.current_streak}🔥`}
                      color="text-purple-400"
                      bg="bg-purple-500/10"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue */}
            <Card className="bg-white/5 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Queue ({queueParticipants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-4 pb-4">
                  {queueParticipants.map((p) => {
                    const isMe = p.user_name === profile?.full_name;
                    const isAnswering = p.current_status === "answering";
                    return (
                      <div
                        key={p.ticket_number}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg mb-1",
                          isAnswering &&
                            "bg-yellow-500/10 border border-yellow-500/30",
                          isMe && "bg-blue-500/10 border border-blue-500/30",
                          p.current_status === "eliminated" && "opacity-40",
                        )}
                      >
                        <span className="text-sm font-mono text-gray-400 w-8">
                          #{p.ticket_number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              isMe ? "text-blue-400" : "text-white",
                            )}
                          >
                            {p.user_name} {isMe && "(You)"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.total_score} pts • {p.correct_answers}/
                            {p.questions_answered}
                          </p>
                        </div>
                        {isAnswering && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 text-xs animate-pulse">
                            Answering
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right - Question Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current answerer */}
            {currentAnsweringUser && !isMyTurn && (
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <div>
                      <p className="text-sm text-gray-400">
                        Currently Answering
                      </p>
                      <p className="text-lg font-bold text-yellow-400">
                        {currentAnsweringUser.user_name}
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          #{currentAnsweringUser.ticket_number}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Question */}
            {(isMyTurn || hasAnswered) && currentQuestion && (
              <Card
                className={cn(
                  "backdrop-blur border-2",
                  isMyTurn && "border-yellow-500/50 bg-yellow-500/5",
                  hasAnswered &&
                    answerResult?.is_correct &&
                    "border-green-500/50 bg-green-500/5",
                  hasAnswered &&
                    !answerResult?.is_correct &&
                    "border-red-500/50 bg-red-500/5",
                )}
              >
                <CardContent className="p-6">
                  {/* Timer */}
                  {isMyTurn && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Badge
                          className={cn(
                            timeLeft <= 2
                              ? "bg-red-500 animate-pulse"
                              : timeLeft <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500",
                          )}
                        >
                          <Timer className="h-3 w-3 mr-1" />
                          {timeLeft}s
                        </Badge>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {currentQuestion.points_value} pts
                          </Badge>
                          <Badge variant="outline">
                            {currentQuestion.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={
                          (timeLeft /
                            (currentQuestion.time_limit_seconds || 5)) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-white mb-6">
                    {currentQuestion.question}
                  </h2>

                  {/* Multiple Choice / True-False */}
                  {(currentQuestion.question_type === "multiple_choice" ||
                    currentQuestion.question_type === "true_false") &&
                    currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                          const isCorrect =
                            idx === currentQuestion.correct_answer_index;
                          const isWrong =
                            hasAnswered &&
                            idx === selectedAnswer &&
                            !answerResult?.is_correct;
                          return (
                            <Button
                              key={idx}
                              variant={
                                hasAnswered && isCorrect
                                  ? "default"
                                  : isWrong
                                    ? "destructive"
                                    : selectedAnswer === idx
                                      ? "default"
                                      : "outline"
                              }
                              className={cn(
                                "w-full justify-start text-left h-auto py-4 px-5",
                                hasAnswered &&
                                  isCorrect &&
                                  "bg-green-600 border-green-500",
                                isWrong && "bg-red-600 border-red-500",
                                isMyTurn &&
                                  !selectedAnswer &&
                                  "hover:bg-purple-500/20",
                              )}
                              onClick={() => handleMultipleChoiceAnswer(idx)}
                              disabled={
                                !isMyTurn ||
                                selectedAnswer !== null ||
                                isSubmitting
                              }
                            >
                              <span className="font-bold mr-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {hasAnswered && isCorrect && (
                                <CheckCircle className="h-5 w-5 text-white" />
                              )}
                              {isWrong && (
                                <XCircle className="h-5 w-5 text-white" />
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                  {/* Open-ended */}
                  {currentQuestion.question_type === "open_ended" && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Type your answer..."
                          disabled={!isMyTurn || isSubmitting}
                          className="bg-white/10 border-gray-600 text-white"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleOpenEndedAnswer()
                          }
                        />
                        <Button
                          onClick={handleOpenEndedAnswer}
                          disabled={
                            !isMyTurn || !textAnswer.trim() || isSubmitting
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {hasAnswered && (
                        <p
                          className={cn(
                            "text-sm",
                            answerResult?.is_correct
                              ? "text-green-400"
                              : "text-red-400",
                          )}
                        >
                          {answerResult?.is_correct
                            ? "✅ Correct!"
                            : "❌ Wrong!"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Result */}
                  {hasAnswered && answerResult && (
                    <div
                      className={cn(
                        "mt-6 p-4 rounded-xl border",
                        answerResult.is_correct
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {answerResult.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                        <span className="font-bold text-white">
                          {answerResult.is_correct ? "Correct!" : "Wrong!"}
                        </span>
                      </div>
                      <p className="text-sm">
                        Points:{" "}
                        <span className="font-bold">
                          {answerResult.is_correct ? "+" : ""}
                          {answerResult.points_earned}
                        </span>
                      </p>
                      {currentQuestion.explanation && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <p className="text-sm text-gray-300">
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Waiting */}
            {!isMyTurn && !hasAnswered && (
              <Card className="bg-white/5 border-purple-500/20">
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Get Ready!
                  </h2>
                  <p className="text-gray-400">
                    {currentAnsweringUser
                      ? `${currentAnsweringUser.user_name} is currently answering`
                      : "Waiting for the host to select a participant"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <Card className="bg-white/5 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboard.slice(0, 10).map((entry, idx) => {
                    const isMe = entry.user_id === profile?.id;
                    return (
                      <div
                        key={entry.user_id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg",
                          isMe && "bg-blue-500/10 border border-blue-500/20",
                        )}
                      >
                        <span className="w-8 text-center text-lg">
                          {idx === 0
                            ? "🥇"
                            : idx === 1
                              ? "🥈"
                              : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                        </span>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isMe ? "text-blue-400" : "text-white",
                            )}
                          >
                            {entry.full_name} {isMe && "(You)"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.correct_answers}/{entry.questions_answered} •{" "}
                            {entry.accuracy}%
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {entry.total_score}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────
function MiniStatBox({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("p-3 rounded-lg text-center", bg)}>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
