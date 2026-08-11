// app/(public)/[businessSlug]/components/BusinessHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ticket, MapPin, Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessHeaderProps {
  logoUrl?: string | null;
  name?: string | null;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  website?: string | null;
  type?: string | null;
  brandColor?: string | null;
  brandSecondaryColor?: string | null;
  businessSlug: string;
}

export function BusinessHeader({
  logoUrl,
  name,
  description,
  location,
  phone,
  website,
  type,
  brandColor,
  brandSecondaryColor,
  businessSlug,
}: BusinessHeaderProps) {
  const router = useRouter();
  const fallbackColor = brandColor || "#8B5CF6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name || "Business"}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/10 shadow-xl"
          />
        ) : (
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl"
            style={{ backgroundColor: fallbackColor }}
          >
            {name?.[0]?.toUpperCase() || "?"}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              {name || "Business"}
            </h1>
            {type && (
              <span
                className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium text-white sm:mx-0 mx-auto w-fit"
                style={{ backgroundColor: fallbackColor }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            )}
          </div>

          {description && (
            <p className="text-white/60 text-sm sm:text-base max-w-2xl mb-3">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-white/50">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {location}
              </span>
            )}
            {phone && (
              <span className="flex items-center gap-1.5">
                <span className="text-white/40">•</span>
                {phone}
              </span>
            )}
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={() => router.push(`/${businessSlug}/code-entry`)}
          className={cn(
            "flex-1 h-12 sm:h-14 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
          )}
          style={{
            background: `linear-gradient(135deg, ${fallbackColor}, ${brandSecondaryColor || fallbackColor})`,
            color: "#fff",
          }}
        >
          <Ticket className="h-5 w-5" />
          I Have a Code
        </button>
      </div>
    </motion.div>
  );
}
