import { useState } from "react";

interface WatchlistModalsState<T> {
  showSearchModal: boolean;
  setShowSearchModal: (show: boolean) => void;
  showSendModal: boolean;
  setShowSendModal: (show: boolean) => void;
  selectedMovie: T | null;
  setSelectedMovie: (movie: T | null) => void;
  movieToRecommend: T | null;
  setMovieToRecommend: (movie: T | null) => void;
}

/**
 * useWatchlistModals - Custom hook for managing watchlist modal state
 *
 * Consolidates all modal state management for the PersonalWatchList component.
 * Manages search modal, send modal, selected movie, and movie to recommend.
 */
export function useWatchlistModals<T = unknown>(): WatchlistModalsState<T> {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<T | null>(null);
  const [movieToRecommend, setMovieToRecommend] = useState<T | null>(null);

  return {
    showSearchModal,
    setShowSearchModal,
    showSendModal,
    setShowSendModal,
    selectedMovie,
    setSelectedMovie,
    movieToRecommend,
    setMovieToRecommend,
  };
}
