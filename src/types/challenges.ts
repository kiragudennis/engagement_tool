// src/types/challenges.ts

export interface Challenge {
  id: string;
  business_id?: string;
  business_slug?: string;
  name: string;
  slug: string;
  description: string | null;
  challenge_type: "trivia";
  scoring_config: TriviaScoringConfig;
  prize_tiers: PrizeTier[];
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "paused" | "ended" | "archived";
  cover_image_url: string | null;
  theme_color: string;
  show_leaderboard: boolean;
  show_ticker: boolean;
  participation_points: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TriviaScoringConfig {
  base_points?: number;
  time_limit?: number;
  speed_bonus_lightning?: number;
  speed_bonus_quick?: number;
  speed_bonus_good?: number;
  streak_bonus_enabled?: boolean;
  spin_game_id?: string;
}

export interface PrizeTier {
  rank: number;
  prize_type: "points" | "discount" | "product" | "badge";
  prize_value: string | number;
  badge?: string;
  description?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  current_score: number;
  current_rank: number | null;
  ticket_number: number | null;
  queue_position: number | null;
  joined_via_spin: boolean;
  joined_at: string;
  last_action_at: string | null;
}

export interface TriviaQuestion {
  id: string;
  challenge_id: string;
  question: string;
  question_type: "multiple_choice" | "true_false" | "open_ended";
  options: string[];
  correct_answer_index: number;
  accepted_answers: string[];
  case_sensitive: boolean;
  difficulty: "easy" | "medium" | "hard" | "bonus";
  points_value: number;
  time_limit_seconds: number;
  display_order: number;
  category: string;
  explanation: string;
  image_url: string | null;
  is_used: boolean;
}

export interface TriviaSelection {
  id: string;
  challenge_id: string;
  question_id: string;
  user_id: string;
  participant_id: string;
  ticket_number: number;
  queue_position: number;
  attempt_number: number;
  selected_answer: number | null;
  is_correct: boolean | null;
  points_earned: number;
  question_shown_at: string;
  answer_submitted_at: string | null;
  response_time_ms: number | null;
  status:
    | "queued"
    | "current"
    | "answered"
    | "timeout"
    | "passed"
    | "skipped"
    | "eliminated";
}

export interface TriviaScore {
  total_score: number;
  correct_answers: number;
  questions_answered: number;
  current_streak: number;
  best_streak: number;
  accuracy: number;
}

export interface QueueStatus {
  ticket_number: number;
  user_name: string;
  queue_position: number;
  is_active: boolean;
  total_score: number;
  questions_answered: number;
  correct_answers: number;
  current_status: "answering" | "eliminated" | "waiting";
}
