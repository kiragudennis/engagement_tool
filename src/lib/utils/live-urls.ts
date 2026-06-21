import { SupabaseClient } from "@supabase/supabase-js";

const slugCache = new Map<string, string>();

export async function getBusinessSlug(
  supabase: SupabaseClient,
  businessId: string,
): Promise<string | null> {
  if (slugCache.has(businessId)) return slugCache.get(businessId)!;

  const { data } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .maybeSingle();

  if (data?.slug) {
    slugCache.set(businessId, data.slug);
    return data.slug;
  }
  return null;
}

export function spinLiveUrl(businessSlug: string, gameId: string) {
  return `/${businessSlug}/spin/live/${gameId}`;
}

export function triviaLiveUrl(businessSlug: string, challengeId: string) {
  return `/${businessSlug}/trivia/${challengeId}/live`;
}

export function drawLiveUrl(businessSlug: string, drawId: string) {
  return `/${businessSlug}/draw/${drawId}/live`;
}

export async function openSpinLive(
  supabase: SupabaseClient,
  game: { id: string; business_id?: string },
) {
  if (!game.business_id) return;
  const slug = await getBusinessSlug(supabase, game.business_id);
  if (slug) window.open(spinLiveUrl(slug, game.id), "_blank");
}

export async function openTriviaLive(
  supabase: SupabaseClient,
  challenge: { id: string; business_id?: string },
) {
  if (!challenge.business_id) return;
  const slug = await getBusinessSlug(supabase, challenge.business_id);
  if (slug) window.open(triviaLiveUrl(slug, challenge.id), "_blank");
}

export async function openDrawLive(
  supabase: SupabaseClient,
  draw: { id: string; business_id?: string },
) {
  if (!draw.business_id) return;
  const slug = await getBusinessSlug(supabase, draw.business_id);
  if (slug) window.open(drawLiveUrl(slug, draw.id), "_blank");
}
