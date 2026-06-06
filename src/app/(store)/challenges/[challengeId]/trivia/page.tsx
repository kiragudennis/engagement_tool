// app/(store)/challenges/[challengeId]/trivia/page.tsx
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
  Ticket,
  Clock,
  Zap,
  Flame,
  Trophy,
  Loader2,
  User,
  Crown,
  ChevronRight,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  QueueStatus,
  TriviaQuestion,
  TriviaScore,
  TriviaSelection,
} from "@/types/challenges";

export default function TriviaChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { supabase, profile } = useAuth();

  // Game state - use a single status-based approach instead of gamePhase
  const [mySelection, setMySelection] = useState<TriviaSelection | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(
    null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [isEliminated, setIsEliminated] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const questionShownAtRef = useRef<number | null>(null);

  // Score and queue
  const [myScore, setMyScore] = useState<TriviaScore | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [queueParticipants, setQueueParticipants] = useState<QueueStatus[]>([]);
  const [currentAnsweringUser, setCurrentAnsweringUser] = useState<{
    user_id: string;
    user_name: string;
    ticket_number: number;
  } | null>(null);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Derived state - no more gamePhase!
  const isMyTurn = mySelection?.status === "current";
  const hasAnswered =
    mySelection?.status === "answered" || mySelection?.status === "timeout";

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
    const { data } = await supabase.rpc("get_trivia_leaderboard", {
      p_challenge_id: challengeId,
      p_limit: 20,
    });
    setLeaderboard(data || []);
  };

  const loadMyScore = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("challenge_trivia_scores")
      .select("*")
      .eq("challenge_id", challengeId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (data) setMyScore(data);
  };

  const loadQueueStatus = async () => {
    if (!profile?.id) return;
    const { data } = await supabase.rpc("get_trivia_queue_status", {
      p_challenge_id: challengeId,
    });
    if (data) {
      setQueueParticipants(data);
      // Find who's currently answering
      const answering = data.find(
        (p: QueueStatus) => p.current_status === "answering",
      );
      if (answering) {
        setCurrentAnsweringUser({
          user_id: "", // We don't have user_id from queue status
          user_name: answering.user_name,
          ticket_number: answering.ticket_number,
        });
      } else {
        setCurrentAnsweringUser(null);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (!profile?.id || !challengeId) return;

    const init = async () => {
      setInitialLoading(true);

      // Check elimination
      const { data: elimCheck } = await supabase
        .from("challenge_trivia_selections")
        .select("status")
        .eq("challenge_id", challengeId)
        .eq("user_id", profile.id)
        .eq("status", "eliminated")
        .limit(1);

      if (elimCheck && elimCheck.length > 0) {
        setIsEliminated(true);
        setInitialLoading(false);
        return;
      }

      // Check for active selection
      const { data: activeSelection } = await supabase
        .from("challenge_trivia_selections")
        .select("*")
        .eq("challenge_id", challengeId)
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
          const remaining = Math.max(
            0,
            Math.ceil((timeLimit - elapsed) / 1000),
          );
          setTimeLeft(remaining);
          questionShownAtRef.current = shownAt;
        } else {
          // Already answered or timeout
          setSelectedAnswer(activeSelection.selected_answer);
          setAnswerResult({
            is_correct: activeSelection.is_correct,
            points_earned: activeSelection.points_earned,
            message: activeSelection.is_correct
              ? "Correct! 🎉"
              : activeSelection.status === "timeout"
                ? "Time's up! ⏰"
                : "Wrong! 😔",
          });
        }
      }

      await Promise.all([loadLeaderboard(), loadQueueStatus(), loadMyScore()]);
      setInitialLoading(false);
    };

    init();
  }, [challengeId, profile?.id]);

  // Real-time subscription - THIS IS THE KEY FIX
  useEffect(() => {
    if (!profile?.id || !challengeId || initialLoading) return;

    console.log("🔌 Setting up real-time for user:", profile.id);

    const channel = supabase
      .channel(`trivia-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenge_trivia_selections",
          filter: `challenge_id=eq.${challengeId}`,
        },
        async (payload) => {
          const selection = payload.new as TriviaSelection;
          console.log(
            "📨 INSERT event:",
            selection.user_id,
            "My ID:",
            profile.id,
          );

          // Always refresh queue
          loadQueueStatus();

          if (selection.user_id === profile.id) {
            console.log("✅ This is MY selection! Loading question...");
            setMySelection(selection);
            const qData = await loadQuestion(selection.question_id);

            setSelectedAnswer(null);
            setTextAnswer("");
            setAnswerResult(null);
            setTimerActive(true);

            const timeLimit = qData?.time_limit_seconds || 5;
            setTimeLeft(timeLimit);
            questionShownAtRef.current = Date.now();

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
          filter: `challenge_id=eq.${challengeId}`,
        },
        async (payload) => {
          const selection = payload.new as TriviaSelection;
          console.log("🔄 UPDATE event:", selection.user_id, selection.status);

          // Always refresh queue
          loadQueueStatus();
          loadLeaderboard();

          if (selection.user_id === profile.id) {
            console.log("✅ My selection updated:", selection.status);
            setMySelection(selection);

            if (selection.status === "answered") {
              setTimerActive(false);
              setSelectedAnswer(selection.selected_answer);
              setAnswerResult({
                is_correct: selection.is_correct,
                points_earned: selection.points_earned,
                message: selection.is_correct ? "Correct! 🎉" : "Wrong! 😔",
              });
              loadMyScore();
              if (selection.is_correct) {
                toast.success(`+${selection.points_earned} points!`);
              }
            } else if (selection.status === "timeout") {
              setTimerActive(false);
              setAnswerResult({
                is_correct: false,
                points_earned: 0,
                message: "Time's up! ⏰",
              });
            } else if (selection.status === "passed") {
              setTimerActive(false);
              setMySelection(null);
              setCurrentQuestion(null);
              toast.info("Question passed to next player");
            } else if (selection.status === "eliminated") {
              setIsEliminated(true);
              toast.error("You've been eliminated");
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Channel status:", status);
      });

    return () => {
      console.log("🔌 Cleaning up channel");
      channel.unsubscribe();
    };
  }, [challengeId, profile?.id, initialLoading]);

  // Timer effect
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

  const handleMultipleChoiceAnswer = async (answerIndex: number) => {
    if (!isMyTurn || selectedAnswer !== null || isSubmitting || !mySelection)
      return;

    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);

    try {
      const responseTimeMs = questionShownAtRef.current
        ? Date.now() - questionShownAtRef.current
        : 0;
      const { error } = await supabase.rpc("submit_trivia_answer", {
        p_selection_id: mySelection.id,
        p_answer_index: answerIndex,
        p_response_time_ms: responseTimeMs,
      });
      if (error) throw error;
      toast.success("Answer submitted!");
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
      const responseTimeMs = questionShownAtRef.current
        ? Date.now() - questionShownAtRef.current
        : 0;
      const { error } = await supabase.rpc("submit_trivia_answer", {
        p_selection_id: mySelection.id,
        p_text_answer: textAnswer.trim(),
        p_response_time_ms: responseTimeMs,
      });
      if (error) throw error;
      toast.success("Answer submitted!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-20 w-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Loading Game</h2>
        </div>
      </div>
    );
  }

  // Eliminated
  if (isEliminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="bg-red-950/30 border-red-500/30 max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Eliminated</h2>
            <p className="text-red-300">Better luck next time!</p>
            {myScore && (
              <p className="text-yellow-400 mt-4 text-xl font-bold">
                Final Score: {myScore.total_score}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRank = leaderboard.findIndex((e) => e.user_id === profile?.id) + 1;

  // MAIN RENDER - Always show everything, no conditional returns
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 border-b border-purple-500/20 bg-purple-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-yellow-500" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  Trivia Challenge
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
                      ? "YOUR TURN - Answer now!"
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
                  <Trophy className="h-3 w-3 mr-1" /> {myScore.total_score} pts
                </Badge>
              )}
              {userRank > 0 && (
                <Badge className="bg-purple-500/20 text-purple-400">
                  <Crown className="h-3 w-3 mr-1" /> #{userRank}
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
            {myScore && (
              <Card className="bg-white/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-yellow-500/10">
                      <p className="text-xl font-bold text-yellow-400">
                        {myScore.total_score}
                      </p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <p className="text-xl font-bold text-green-400">
                        {myScore.correct_answers}/{myScore.questions_answered}
                      </p>
                      <p className="text-xs text-gray-400">Correct</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <p className="text-xl font-bold text-blue-400">
                        {myScore.accuracy}%
                      </p>
                      <p className="text-xs text-gray-400">Accuracy</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <p className="text-xl font-bold text-purple-400">
                        {myScore.current_streak}🔥
                      </p>
                      <p className="text-xs text-gray-400">Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/5 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Queue ({queueParticipants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-4 pb-4">
                  {queueParticipants.map((p, idx) => {
                    const isMe =
                      p.user_name === (profile?.full_name || profile?.email);
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
                        {isMe && !isAnswering && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            Waiting
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
            {/* Show who's answering (when it's not me) */}
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
                          Ticket #{currentAnsweringUser.ticket_number}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MY QUESTION - Show when it's my turn or I've answered */}
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
                          <Timer className="h-3 w-3 mr-1" /> {timeLeft}s
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

                  {/* Question */}
                  <h2 className="text-xl font-bold text-white mb-6">
                    {currentQuestion.question}
                  </h2>

                  {/* MULTIPLE CHOICE / TRUE-FALSE */}
                  {(currentQuestion.question_type === "multiple_choice" ||
                    currentQuestion.question_type === "true_false") &&
                    currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map(
                          (option: string, idx: number) => {
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
                          },
                        )}
                      </div>
                    )}

                  {/* OPEN-ENDED */}
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
                            : "❌ Wrong! Accepted answers: " +
                              (currentQuestion.accepted_answers?.join(", ") ||
                                "N/A")}
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
                          {answerResult.message}
                        </span>
                      </div>
                      <p className="text-sm">
                        Points:{" "}
                        <span className="font-bold">
                          {answerResult.is_correct ? "+" : ""}
                          {answerResult.points_earned}
                        </span>
                        {answerResult.response_time_ms && (
                          <span className="text-gray-400 ml-4">
                            ({(answerResult.response_time_ms / 1000).toFixed(1)}
                            s)
                          </span>
                        )}
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

            {/* Waiting state (no active question for me) */}
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
                    <Trophy className="h-4 w-4 text-yellow-500" /> Leaderboard
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
