/**
 * Mock Data for Local Development
 * Perfect data structure that matches our needs exactly
 * No database until this works perfectly!
 */

// ============================================
// TYPES
// ============================================

export interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
}

export interface Recommendation {
  id: string;

  // Relationships
  from_user_id: string;
  to_user_id: string;

  // Media Info
  external_id: string; // Spotify/TMDB/etc ID
  media_type: "song" | "album" | "movie" | "tv";
  title: string;

  // Media-specific fields
  artist?: string; // Music only
  album?: string; // Music only
  poster_url?: string; // All media
  year?: number; // All media

  // Recommendation metadata
  recommendation_type: "watch" | "rewatch" | "listen" | "relisten";
  sent_message?: string; // Initial message when sending
  sender_note?: string; // Sender's personal note (added anytime)
  recipient_note?: string; // Recipient's personal note (added anytime)

  // Status
  status: "pending" | "consumed" | "hit" | "miss";
  opened_at?: string; // When recipient first viewed
  consumed_at?: string; // When marked as consumed/hit/miss

  // Timestamps
  created_at: string;
}

// ============================================
// MOCK USERS
// ============================================

export const CURRENT_USER_ID = "current-user-123";

export const mockUsers: UserProfile[] = [
  {
    user_id: CURRENT_USER_ID,
    display_name: "Afton Gauntlett",
    email: "afton.gauntlett@gmail.com",
  },
  {
    user_id: "john-doe-456",
    display_name: "John Doe",
    email: "john@example.com",
  },
  {
    user_id: "sarah-smith-789",
    display_name: "Sarah Smith",
    email: "sarah@example.com",
  },
];

// ============================================
// MOCK MUSIC RECOMMENDATIONS
// ============================================

export const mockMusicRecommendations: Recommendation[] = [
  // RECEIVED FROM JOHN - Pending
  {
    id: "music-rec-1",
    from_user_id: "john-doe-456",
    to_user_id: CURRENT_USER_ID,
    external_id: "1301",
    media_type: "song",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4f/32/6e/4f326e76-9a6a-3b9b-3c23-9d396d3c3e3c/20UMGIM04801.rgb.jpg/200x200bb.jpg",
    year: 2020,
    recommendation_type: "listen",
    sent_message: "This song is incredible! Perfect driving music 🚗",
    sender_note: "One of my all-time favorites",
    status: "pending",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },

  // RECEIVED FROM JOHN - Hit
  {
    id: "music-rec-2",
    from_user_id: "john-doe-456",
    to_user_id: CURRENT_USER_ID,
    external_id: "1302",
    media_type: "song",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/79/6c/b1/796cb1c3-d640-8d4d-e4c1-3035ef7b3a5e/20UMGIM25955.rgb.jpg/200x200bb.jpg",
    year: 2020,
    recommendation_type: "listen",
    sent_message: "Dance party time! 💃",
    sender_note: "Best disco-pop track",
    recipient_note: "Absolutely love this! Can't stop dancing",
    status: "hit",
    opened_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    consumed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },

  // RECEIVED FROM JOHN - Miss
  {
    id: "music-rec-3",
    from_user_id: "john-doe-456",
    to_user_id: CURRENT_USER_ID,
    external_id: "1303",
    media_type: "song",
    title: "Bad Guy",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep, Where Do We Go?",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/96/87/f3/9687f3e9-1e4f-6c78-3c9b-3b0f83c66bb7/19UMGIM09814.rgb.jpg/200x200bb.jpg",
    year: 2019,
    recommendation_type: "listen",
    sent_message: "Thought you might vibe with this",
    recipient_note: "Not really my style, but I appreciate it",
    status: "miss",
    opened_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    consumed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // RECEIVED FROM SARAH - Pending
  {
    id: "music-rec-4",
    from_user_id: "sarah-smith-789",
    to_user_id: CURRENT_USER_ID,
    external_id: "1304",
    media_type: "song",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/5d/31/0a/5d310a8c-96e3-6b3e-e940-dba9e55a9e58/19UM1IM23005.rgb.jpg/200x200bb.jpg",
    year: 2019,
    recommendation_type: "listen",
    sent_message: "Summer vibes! ☀️",
    sender_note: "Makes me so happy every time",
    status: "pending",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },

  // SENT TO JOHN - Not opened yet
  {
    id: "music-rec-5",
    from_user_id: CURRENT_USER_ID,
    to_user_id: "john-doe-456",
    external_id: "1305",
    media_type: "song",
    title: "drivers license",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b9/9e/13/b99e1366-8b26-0ce6-c485-eee2cf6a932f/21UMGIM01593.rgb.jpg/200x200bb.jpg",
    year: 2021,
    recommendation_type: "listen",
    sent_message: "This hits different 🥺",
    sender_note: "One of the best debut singles ever",
    status: "pending",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  },

  // SENT TO JOHN - Opened and marked as hit
  {
    id: "music-rec-6",
    from_user_id: CURRENT_USER_ID,
    to_user_id: "john-doe-456",
    external_id: "1306",
    media_type: "song",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b9/9e/13/b99e1366-8b26-0ce6-c485-eee2cf6a932f/21UMGIM01593.rgb.jpg/200x200bb.jpg",
    year: 2021,
    recommendation_type: "listen",
    sent_message: "Pop punk energy!",
    sender_note: "Perfect gym song",
    recipient_note: "Loved it! Added to my playlist",
    status: "hit",
    opened_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    consumed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // SENT TO SARAH - Opened but still pending
  {
    id: "music-rec-7",
    from_user_id: CURRENT_USER_ID,
    to_user_id: "sarah-smith-789",
    external_id: "1307",
    media_type: "song",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    poster_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/44/04/e1/4404e184-f3cf-0ec3-b2da-b5b00b6fd846/22UMGIM36291.rgb.jpg/200x200bb.jpg",
    year: 2022,
    recommendation_type: "listen",
    sent_message: "Instant classic",
    sender_note: "His best work yet",
    status: "pending",
    opened_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// MOCK MOVIE RECOMMENDATIONS
// ============================================

export const mockMovieRecommendations: Recommendation[] = [
  // RECEIVED FROM JOHN - Pending
  {
    id: "movie-rec-1",
    from_user_id: "john-doe-456",
    to_user_id: CURRENT_USER_ID,
    external_id: "550",
    media_type: "movie",
    title: "Fight Club",
    poster_url:
      "https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    year: 1999,
    recommendation_type: "watch",
    sent_message: "Must watch! Mind-blowing ending 🤯",
    sender_note: "Top 5 all-time favorite",
    status: "pending",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // RECEIVED FROM SARAH - Hit
  {
    id: "movie-rec-2",
    from_user_id: "sarah-smith-789",
    to_user_id: CURRENT_USER_ID,
    external_id: "13",
    media_type: "movie",
    title: "Forrest Gump",
    poster_url:
      "https://image.tmdb.org/t/p/w200/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    year: 1994,
    recommendation_type: "watch",
    sent_message: "Get the tissues ready! 😭",
    sender_note: "Makes me cry every time",
    recipient_note: "Such a beautiful story. Cried for hours!",
    status: "hit",
    opened_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    consumed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // SENT TO JOHN - Not opened
  {
    id: "movie-rec-3",
    from_user_id: CURRENT_USER_ID,
    to_user_id: "john-doe-456",
    external_id: "680",
    media_type: "movie",
    title: "Pulp Fiction",
    poster_url:
      "https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    year: 1994,
    recommendation_type: "watch",
    sent_message: "Tarantino masterpiece!",
    sender_note: "Best dialogue ever written",
    status: "pending",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getUserProfile(userId: string): UserProfile | undefined {
  return mockUsers.find((u) => u.user_id === userId);
}

export function getReceivedRecommendations(
  userId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Recommendation[] {
  let recs = [...mockMusicRecommendations, ...mockMovieRecommendations].filter(
    (r) => r.to_user_id === userId
  );

  if (mediaType) {
    recs = recs.filter((r) => r.media_type === mediaType);
  }

  return recs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getSentRecommendations(
  userId: string,
  mediaType?: "song" | "album" | "movie" | "tv"
): Recommendation[] {
  let recs = [...mockMusicRecommendations, ...mockMovieRecommendations].filter(
    (r) => r.from_user_id === userId
  );

  if (mediaType) {
    recs = recs.filter((r) => r.media_type === mediaType);
  }

  return recs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getRecommendationsByStatus(
  userId: string,
  status: "hit" | "miss" | "pending" | "consumed",
  mediaType?: "song" | "album" | "movie" | "tv"
): Recommendation[] {
  const recs = getReceivedRecommendations(userId, mediaType).filter(
    (r) => r.status === status
  );

  return recs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ============================================
// MOCK API FUNCTIONS
// These will be replaced with real Supabase calls later
// ============================================

export const mockApi = {
  // Get all recommendations for current user
  getRecommendations: async (
    userId: string,
    filters?: {
      status?: string;
      mediaType?: "song" | "album" | "movie" | "tv";
      fromUserId?: string;
      direction?: "received" | "sent";
    }
  ): Promise<Recommendation[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

    let recs = [...mockMusicRecommendations, ...mockMovieRecommendations];

    if (filters?.direction === "received") {
      recs = recs.filter((r) => r.to_user_id === userId);
    } else if (filters?.direction === "sent") {
      recs = recs.filter((r) => r.from_user_id === userId);
    }

    if (filters?.status) {
      recs = recs.filter((r) => r.status === filters.status);
    }

    if (filters?.mediaType) {
      recs = recs.filter((r) => r.media_type === filters.mediaType);
    }

    if (filters?.fromUserId) {
      recs = recs.filter((r) => r.from_user_id === filters.fromUserId);
    }

    return recs;
  },

  // Update recommendation status
  updateStatus: async (
    recId: string,
    status: string,
    recipientNote?: string
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const rec = [...mockMusicRecommendations, ...mockMovieRecommendations].find(
      (r) => r.id === recId
    );

    if (rec) {
      rec.status = status as "pending" | "consumed" | "hit" | "miss";
      if (recipientNote !== undefined) {
        rec.recipient_note = recipientNote;
      }
      if (status !== "pending") {
        rec.consumed_at = new Date().toISOString();
      }
    }
  },

  // Update sender note
  updateSenderNote: async (
    recId: string,
    senderNote: string
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const rec = [...mockMusicRecommendations, ...mockMovieRecommendations].find(
      (r) => r.id === recId
    );

    if (rec) {
      rec.sender_note = senderNote;
    }
  },

  // Delete recommendation
  deleteRecommendation: async (recId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Remove from arrays
    const musicIndex = mockMusicRecommendations.findIndex(
      (r) => r.id === recId
    );
    if (musicIndex > -1) {
      mockMusicRecommendations.splice(musicIndex, 1);
    }

    const movieIndex = mockMovieRecommendations.findIndex(
      (r) => r.id === recId
    );
    if (movieIndex > -1) {
      mockMovieRecommendations.splice(movieIndex, 1);
    }
  },

  // Mark as opened
  markAsOpened: async (recId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const rec = [...mockMusicRecommendations, ...mockMovieRecommendations].find(
      (r) => r.id === recId
    );

    if (rec && !rec.opened_at) {
      rec.opened_at = new Date().toISOString();
    }
  },
};
