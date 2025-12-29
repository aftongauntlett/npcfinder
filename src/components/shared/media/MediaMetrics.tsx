import MetadataGrid, { type MetadataGridItem } from "./MetadataGrid";

interface MediaMetricsProps {
  criticRatings?: {
    rottenTomatoes?: number;
    metacritic?: number;
    imdb?: number;
  };
  awards?: string;
  boxOffice?: string;
  className?: string;
}

/**
 * Parse awards string and extract individual awards as chips
 * Common patterns: "Won 1 Oscar. 10 wins & 39 nominations total"
 */
const parseAwards = (awardsText: string): string[] => {
  const awards: string[] = [];

  // Extract Oscar wins
  const oscarMatch = awardsText.match(/Won (\d+) Oscar/i);
  if (oscarMatch) {
    const count = parseInt(oscarMatch[1]);
    awards.push(count === 1 ? "Oscar Winner" : `${count} Oscars`);
  }

  // Extract nominated for Oscar
  if (awardsText.match(/Nominated for (\d+) Oscar/i)) {
    awards.push("Oscar Nominated");
  }

  // Extract other wins
  const winsMatch = awardsText.match(/(\d+) wins?/i);
  if (winsMatch && !oscarMatch) {
    awards.push(`${winsMatch[1]} Wins`);
  }

  // Extract nominations
  const nomsMatch = awardsText.match(/(\d+) nominations?/i);
  if (nomsMatch) {
    awards.push(`${nomsMatch[1]} Nominations`);
  }

  // Extract BAFTA
  if (awardsText.match(/BAFTA/i)) {
    awards.push("BAFTA");
  }

  // Extract Golden Globe
  if (awardsText.match(/Golden Globe/i)) {
    awards.push("Golden Globe");
  }

  return awards;
};

/**
 * Get color styling for award chips
 */
const getAwardChipStyle = (award: string): string => {
  if (award.includes("Oscar")) {
    return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
  }
  if (award.includes("Golden Globe")) {
    return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700";
  }
  if (award.includes("BAFTA")) {
    return "bg-primary/10 text-primary border-primary/30";
  }
  if (award.includes("Wins")) {
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
  }
  if (award.includes("Nominations")) {
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
  }
  return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700";
};

export default function MediaMetrics({
  criticRatings,
  awards,
  boxOffice,
  className = "",
}: MediaMetricsProps) {
  const items: MetadataGridItem[] = [];

  // Add critic ratings
  if (criticRatings?.rottenTomatoes) {
    items.push({
      label: "Rotten Tomatoes",
      value: `${criticRatings.rottenTomatoes}%`,
    });
  }
  if (criticRatings?.metacritic) {
    items.push({
      label: "Metacritic",
      value: criticRatings.metacritic.toString(),
    });
  }
  if (criticRatings?.imdb) {
    items.push({
      label: "IMDB",
      value: `${criticRatings.imdb}/10`,
    });
  }

  // Add box office
  if (boxOffice) {
    items.push({
      label: "Box Office",
      value: boxOffice,
    });
  }

  const parsedAwards = awards ? parseAwards(awards) : [];
  const hasRatings = items.length > 0;

  if (!hasRatings && parsedAwards.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Critic Ratings and Box Office */}
      {hasRatings && <MetadataGrid items={items} columns={3} />}

      {/* Awards as Chips */}
      {parsedAwards.length > 0 && (
        <div>
          <h4 className="metadata-label mb-2">Awards</h4>
          <div className="flex flex-wrap gap-2">
            {parsedAwards.map((award, index) => (
              <span
                key={index}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium ${getAwardChipStyle(
                  award
                )}`}
              >
                {award}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
