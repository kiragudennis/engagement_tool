// app/(public)/[businessSlug]/page.tsx
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CoverBanner } from "@/components/business/CoverBanner";
import { BusinessHeader } from "@/components/business/BusinessHeader";
import { StatsBar } from "@/components/business/StatsBar";
import { GamesSection } from "@/components/business/GamesSection";
import { DrawsSection } from "@/components/business/DrawsSection";
import { TriviaSection } from "@/components/business/TriviaSection";
import { ResultsSection } from "@/components/business/ResultsSection";
import { PublicCodesSection } from "@/components/business/PublicCodesSection";
import { PointsValueSection } from "@/components/business/PointsValueSection";
import { Business } from "@/types/business";
import { SpinGame } from "@/types/spinning-wheel";
import { Draw } from "@/types/draws";
import { Challenge } from "@/types/challenges";
import { PassBusinessToClient } from "@/components/business/PassBusinessToClient";

export const revalidate = 60;

interface BusinessLandingPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessLandingPage({
  params,
}: BusinessLandingPageProps) {
  const { businessSlug } = await params;

  if (!businessSlug) {
    return <div className="min-h-screen bg-gray-950" />;
  }

  const [
    { data: business },
    { data: games },
    { data: draws },
    { data: challenge },
    { data: publicCodes },
    { data: recentWinners },
  ] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select(
        "id, name, slug, logo_url, brand_color, brand_secondary_color, cover_image_url, description, location, phone, website, type, points_per_redemption, points_value, engagements_this_month, spins_this_month, trivia_answers_this_month, draw_entries_this_month, viewer_prizes_claimed",
      )
      .eq("slug", businessSlug)
      .single(),
    supabaseAdmin
      .from("spin_games")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("draws")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("status", "active")
      .eq("challenge_type", "trivia")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("access_codes")
      .select("*")
      .eq("type", "public")
      .eq("is_active", true)
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("spin_attempts")
      .select(
        "id, prize_type, prize_value, landed_at, users!user_id(full_name)",
      )
      .not("prize_type", "is", null)
      .neq("prize_type", "points")
      .order("landed_at", { ascending: false })
      .limit(10),
  ]);

  const biz = business as Business | null;
  const gamesData = (games as SpinGame[]) || [];
  const drawsData = (draws as Draw[]) || [];
  const challengeData = challenge as Challenge | null;
  const publicCodesData = (publicCodes as any[]) || [];
  const winnersData = (recentWinners as any[]) || [];

  const filteredGames = gamesData.filter((g) => g.business_id === biz?.id);
  const filteredDraws = drawsData.filter((d) => d.business_id === biz?.id);

  const anonymizedWinners: Array<{
    id: string;
    name: string;
    prize: string;
    type: "spin" | "draw";
  }> = winnersData
    .filter((w) => w.users && w.users.full_name)
    .map((w) => {
      const name = w.users.full_name as string;
      const parts = name.split(" ");
      const first = parts[0] || "";
      const last = parts.length > 1 ? parts[parts.length - 1][0] + "." : "";
      return {
        id: w.id,
        name: `${first} ${last}`.trim(),
        prize: w.prize_value || w.prize_type,
        type: "spin",
      };
    });

  return (
    <div className="min-h-screen bg-gray-950">
      <PassBusinessToClient business={biz} />

      <CoverBanner
        coverImageUrl={biz?.cover_image_url}
        brandColor={biz?.brand_color}
      />
      <div className="relative -mt-32 z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <BusinessHeader
            logoUrl={biz?.logo_url}
            name={biz?.name}
            description={biz?.description}
            location={biz?.location}
            phone={biz?.phone}
            website={biz?.website}
            type={biz?.type}
            brandColor={biz?.brand_color}
            brandSecondaryColor={biz?.brand_secondary_color}
            businessSlug={businessSlug}
          />

          <StatsBar
            engagements={biz?.engagements_this_month || 0}
            spins={biz?.spins_this_month || 0}
            trivia={biz?.trivia_answers_this_month || 0}
            draws={biz?.draw_entries_this_month || 0}
            prizes={biz?.viewer_prizes_claimed || 0}
          />

          {filteredGames.length > 0 && (
            <GamesSection
              games={filteredGames}
              businessSlug={businessSlug}
              brandColor={biz?.brand_color}
            />
          )}

          {filteredDraws.length > 0 && (
            <DrawsSection
              draws={filteredDraws}
              businessSlug={businessSlug}
              brandColor={biz?.brand_color}
            />
          )}

          {challengeData && (
            <TriviaSection
              challenge={challengeData}
              businessSlug={businessSlug}
              brandColor={biz?.brand_color}
            />
          )}

          {anonymizedWinners.length > 0 && (
            <ResultsSection
              winners={anonymizedWinners}
              businessSlug={businessSlug}
            />
          )}

          <PublicCodesSection
            codes={publicCodesData}
            businessSlug={businessSlug}
          />

          <PointsValueSection
            pointsPerRedemption={biz?.points_per_redemption || 10}
            pointsValue={biz?.points_value || 0.001}
          />
        </div>
      </div>
    </div>
  );
}
