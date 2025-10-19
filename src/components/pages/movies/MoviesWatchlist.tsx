import React from "react";
import PersonalWatchList from "../../media/PersonalWatchList";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";

/**
 * Movies & TV Watchlist Page
 * Displays user's personal watchlist with add/remove functionality
 */
const MoviesWatchlist: React.FC = () => {
  return (
    <MainLayout>
      <ContentLayout
        title="Watch List"
        description="Track movies and TV shows you want to watch."
      >
        <PersonalWatchList />
      </ContentLayout>
    </MainLayout>
  );
};

export default MoviesWatchlist;
