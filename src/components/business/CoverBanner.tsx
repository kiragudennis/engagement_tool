// app/(public)/[businessSlug]/components/CoverBanner.tsx
"use client";

interface CoverBannerProps {
  coverImageUrl?: string | null;
  brandColor?: string | null;
}

export function CoverBanner({ coverImageUrl, brandColor }: CoverBannerProps) {
  const fallbackColor = brandColor || "#8B5CF6";

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden">
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${fallbackColor}40, ${fallbackColor}10)`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
    </div>
  );
}
