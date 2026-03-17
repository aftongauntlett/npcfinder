// @ts-nocheck
/**
 * Supabase Edge Function: populate-media-cache
 *
 * Required secrets (set via `supabase secrets set`):
 * - TMDB_API_KEY
 * - OMDB_API_KEY
 * - GOOGLE_BOOKS_API_KEY
 * - RAWG_API_KEY
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type MediaType =
  | "movie"
  | "tv"
  | "book"
  | "game"
  | "song"
  | "album"
  | "playlist";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const canonicalMediaTypes: MediaType[] = [
  "movie",
  "tv",
  "book",
  "game",
  "song",
  "album",
  "playlist",
];

function isMediaType(value: unknown): value is MediaType {
  return (
    typeof value === "string" &&
    canonicalMediaTypes.includes(value as MediaType)
  );
}

async function fetchMovieOrTvDetails(
  externalId: string,
  mediaType: "movie" | "tv",
) {
  const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
  if (!tmdbApiKey) {
    throw new Error("TMDB key is not configured");
  }

  const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${externalId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    throw new Error(`TMDB details fetch failed (${detailsRes.status})`);
  }

  const data = await detailsRes.json();

  const crew = data?.credits?.crew || [];
  const cast = (data?.credits?.cast || [])
    .map((actor: { name?: string }) => actor.name)
    .filter(Boolean)
    .slice(0, 20);

  const director =
    mediaType === "movie"
      ? crew.find((c: { job?: string }) => c.job === "Director")?.name || null
      : crew.find(
          (c: { job?: string }) =>
            c.job === "Creator" || c.job === "Executive Producer",
        )?.name || null;

  const producer =
    crew.find((c: { job?: string }) => c.job === "Producer")?.name || null;
  const cinematographer =
    crew.find((c: { job?: string }) => c.job === "Director of Photography")
      ?.name || null;
  const writer =
    crew.find(
      (c: { job?: string }) => c.job === "Screenplay" || c.job === "Writer",
    )?.name || null;

  const imdbId = data?.external_ids?.imdb_id as string | undefined;

  let imdbRating: string | null = null;
  let rottenTomatoesScore: string | null = null;
  let metacriticScore: string | null = null;
  let awardsText: string | null = null;
  let boxOffice: string | null = null;

  const omdbApiKey = Deno.env.get("OMDB_API_KEY");
  if (omdbApiKey && imdbId) {
    const omdbRes = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}`,
    );
    if (omdbRes.ok) {
      const omdb = await omdbRes.json();
      if (omdb?.Response !== "False") {
        imdbRating = omdb?.imdbRating || null;
        awardsText = omdb?.Awards || null;
        boxOffice = omdb?.BoxOffice || null;

        const ratings = Array.isArray(omdb?.Ratings) ? omdb.Ratings : [];
        const rt = ratings.find((r: { Source?: string }) =>
          String(r?.Source || "").includes("Rotten Tomatoes"),
        );
        const mc = ratings.find((r: { Source?: string }) =>
          String(r?.Source || "").includes("Metacritic"),
        );

        const rtMatch = String(rt?.Value || "").match(/(\d+)%/);
        if (rtMatch) rottenTomatoesScore = rtMatch[1];

        const mcMatch = String(mc?.Value || "").match(/(\d+)/);
        if (mcMatch) metacriticScore = mcMatch[1];
      }
    }
  }

  return {
    external_id: String(data.id),
    title: data.title || data.name || "Unknown Title",
    media_type: mediaType,
    poster_url: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : null,
    release_date: data.release_date || data.first_air_date || null,
    overview: data.overview || null,
    director,
    producer,
    cinematographer,
    writer,
    cast,
    genres: (data.genres || [])
      .map((g: { name?: string }) => g.name)
      .filter(Boolean),
    vote_average: data.vote_average || null,
    vote_count: data.vote_count || null,
    runtime: data.runtime || null,
    imdb_rating: imdbRating,
    rotten_tomatoes_score: rottenTomatoesScore,
    metacritic_score: metacriticScore,
    awards_text: awardsText,
    box_office: boxOffice,
    imdb_id: imdbId || null,
  };
}

async function fetchBookDetails(externalId: string) {
  const apiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY") || "";
  const params = new URLSearchParams({ key: apiKey });
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(externalId)}?${params}`,
  );
  if (!response.ok) {
    throw new Error(`Google Books fetch failed (${response.status})`);
  }

  const data = await response.json();
  const info = data?.volumeInfo || {};
  const identifiers = Array.isArray(info?.industryIdentifiers)
    ? info.industryIdentifiers
    : [];
  const isbn13 = identifiers.find(
    (entry: { type?: string }) => entry.type === "ISBN_13",
  )?.identifier;
  const isbn10 = identifiers.find(
    (entry: { type?: string }) => entry.type === "ISBN_10",
  )?.identifier;

  return {
    external_id: String(data?.id || externalId),
    media_type: "book" as const,
    title: info?.title || "Unknown Title",
    authors: Array.isArray(info?.authors) ? info.authors.join(", ") : null,
    poster_url:
      info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || null,
    release_date: info?.publishedDate || null,
    description: info?.description || null,
    page_count: info?.pageCount || null,
    categories: Array.isArray(info?.categories)
      ? info.categories.join(", ")
      : null,
    publisher: info?.publisher || null,
    isbn: isbn13 || isbn10 || null,
    average_rating: info?.averageRating || null,
  };
}

async function fetchGameDetails(externalId: string) {
  const apiKey = Deno.env.get("RAWG_API_KEY");
  if (!apiKey) {
    throw new Error("RAWG key is not configured");
  }

  const response = await fetch(
    `https://api.rawg.io/api/games/${encodeURIComponent(externalId)}?key=${apiKey}`,
  );
  if (!response.ok) {
    throw new Error(`RAWG fetch failed (${response.status})`);
  }

  const data = await response.json();

  return {
    external_id: String(data?.id || externalId),
    media_type: "game" as const,
    title: data?.name || "Unknown Game",
    poster_url: data?.background_image || null,
    release_date: data?.released || null,
    description: data?.description_raw || null,
    platforms: Array.isArray(data?.platforms)
      ? data.platforms
          .map((p: { platform?: { name?: string } }) => p?.platform?.name)
          .filter(Boolean)
          .join(", ")
      : null,
    genres: Array.isArray(data?.genres)
      ? data.genres
          .map((g: { name?: string }) => g?.name)
          .filter(Boolean)
          .join(", ")
      : null,
    rating: data?.rating || null,
    metacritic: data?.metacritic || null,
    playtime: data?.playtime || null,
  };
}

async function fetchMusicDetails(
  externalId: string,
  mediaType: "song" | "album" | "playlist",
) {
  const entity =
    mediaType === "song"
      ? "song"
      : mediaType === "album"
        ? "album"
        : "playlist";
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(externalId)}&entity=${entity}`,
  );
  if (!response.ok) {
    throw new Error(`iTunes fetch failed (${response.status})`);
  }

  const payload = await response.json();
  const result = Array.isArray(payload?.results) ? payload.results[0] : null;
  if (!result) {
    throw new Error("iTunes lookup returned no result");
  }

  return {
    external_id: String(result.trackId || result.collectionId || externalId),
    media_type: mediaType,
    title:
      result.trackName ||
      result.collectionName ||
      result.artistName ||
      "Unknown Title",
    artist: result.artistName || null,
    album: result.collectionName || null,
    poster_url: result.artworkUrl100 || null,
    release_date: result.releaseDate || null,
    genre: result.primaryGenreName || null,
    track_duration: result.trackTimeMillis || null,
    track_count: result.trackCount || null,
    preview_url: result.previewUrl || null,
  };
}

async function fetchDetails(externalId: string, mediaType: MediaType) {
  if (mediaType === "movie" || mediaType === "tv") {
    return fetchMovieOrTvDetails(externalId, mediaType);
  }

  if (mediaType === "book") {
    return fetchBookDetails(externalId);
  }

  if (mediaType === "game") {
    return fetchGameDetails(externalId);
  }

  return fetchMusicDetails(externalId, mediaType);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const body = await req.json();
    const externalId = String(body?.externalId || "").trim();
    const mediaType = body?.mediaType;
    const ttlMs =
      typeof body?.ttlMs === "number" && body.ttlMs > 0
        ? body.ttlMs
        : 1000 * 60 * 60 * 24 * 180;

    if (!externalId || !isMediaType(mediaType)) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const details = await fetchDetails(externalId, mediaType);
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + ttlMs).toISOString();

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error: upsertError } = await serviceClient
      .from("media_details_cache")
      .upsert(
        {
          external_id: details.external_id,
          media_type: details.media_type,
          data: details,
          fetched_at: nowIso,
          expires_at: expiresAtIso,
          updated_at: nowIso,
        },
        { onConflict: "external_id,media_type" },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return new Response(
      JSON.stringify({ ok: true, externalId, mediaType, details }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
