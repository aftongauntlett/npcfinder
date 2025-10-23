import { useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { parseImportData } from "../../utils/importParser";
import {
  batchSearchMedia,
  getBatchSearchSummary,
  type SearchResult,
  type BatchSearchProgress,
} from "../../utils/batchMediaSearch";
import { useBatchAddToWatchlist } from "../../hooks/useWatchlistQueries";
import { fetchDetailedMediaInfo } from "../../utils/tmdbDetails";
import type { AddWatchlistItemData } from "../../services/recommendationsService";

interface ImportMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

type ImportStep = "input" | "searching" | "review" | "importing" | "complete";

export default function ImportMediaModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportMediaModalProps) {
  const [step, setStep] = useState<ImportStep>("input");
  const [pastedText, setPastedText] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [searchProgress, setSearchProgress] =
    useState<BatchSearchProgress | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(
    new Set()
  );

  const batchAddMutation = useBatchAddToWatchlist();

  // Parse and search
  const handleSearch = async () => {
    if (!pastedText.trim()) {
      setParseErrors(["Please enter or upload a list of movies"]);
      return;
    }

    // Parse input
    const parseResult = parseImportData(pastedText, "input.txt");

    if (parseResult.errors.length > 0) {
      setParseErrors(parseResult.errors);
    }

    if (parseResult.titles.length === 0) {
      setParseErrors(["No valid movie titles found"]);
      return;
    }

    // Start searching
    setStep("searching");
    setSearchProgress({
      current: 0,
      total: parseResult.titles.length,
      percentage: 0,
    });

    try {
      const results = await batchSearchMedia(parseResult.titles, {
        onProgress: (progress) => setSearchProgress(progress),
      });

      setSearchResults(results);

      // Auto-select exact matches
      const exactMatches = results
        .map((r, i) => (r.status === "exact" ? i : -1))
        .filter((i) => i !== -1);
      setSelectedResults(new Set(exactMatches));

      setStep("review");
    } catch (error) {
      setParseErrors([
        error instanceof Error ? error.message : "Search failed",
      ]);
      setStep("input");
    }
  };

  // Toggle result selection
  const toggleResult = (index: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedResults(newSelected);
  };

  // Import selected results
  const handleImport = async () => {
    setStep("importing");

    const itemsToAdd: AddWatchlistItemData[] = [];

    // Fetch detailed info for each selected result
    for (const index of Array.from(selectedResults)) {
      const result = searchResults[index];
      if (!result.movie) continue;

      try {
        const detailedInfo = await fetchDetailedMediaInfo(
          result.movie.external_id,
          result.movie.media_type === "tv" ? "tv" : "movie"
        );

        if (detailedInfo) {
          itemsToAdd.push({
            external_id: detailedInfo.external_id,
            media_type: detailedInfo.media_type,
            title: detailedInfo.title,
            poster_url: detailedInfo.poster_url,
            release_date: detailedInfo.release_date,
            overview: detailedInfo.overview,
            director: detailedInfo.director,
            cast_members:
              detailedInfo.cast.length > 0 ? detailedInfo.cast : null,
            genres: detailedInfo.genres.length > 0 ? detailedInfo.genres : null,
            vote_average: detailedInfo.vote_average,
            vote_count: detailedInfo.vote_count,
            runtime: detailedInfo.runtime,
          });
        }
      } catch (error) {
        console.error(
          `Failed to fetch details for ${result.movie.title}:`,
          error
        );
        // Continue with basic info if detailed fetch fails
        itemsToAdd.push({
          external_id: result.movie.external_id,
          media_type: result.movie.media_type === "tv" ? "tv" : "movie",
          title: result.movie.title,
          poster_url: result.movie.poster_url,
          release_date: result.movie.release_date,
          overview: result.movie.description || null,
        });
      }
    }

    // Batch insert
    try {
      const results = await batchAddMutation.mutateAsync(itemsToAdd);
      setStep("complete");
      onSuccess?.(results.successful.length);
    } catch (error) {
      setParseErrors([
        error instanceof Error ? error.message : "Import failed",
      ]);
      setStep("review");
    }
  };

  // Close and reset
  const handleClose = () => {
    setStep("input");
    setPastedText("");
    setParseErrors([]);
    setSearchProgress(null);
    setSearchResults([]);
    setSelectedResults(new Set());
    onClose();
  };

  const summary =
    searchResults.length > 0 ? getBatchSearchSummary(searchResults) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Movie List"
      maxWidth="4xl"
      showCloseButton={true}
      closeOnBackdropClick={step === "input" || step === "complete"}
    >
      {/* Content - max height and scrollable */}
      <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-6">
        {/* Step 1: Input */}
        {step === "input" && (
          <div className="space-y-6">
            {/* Text area */}
            <div>
              <textarea
                id="movie-list"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your list here... (one movie per line, comma-separated, or JSON format)"
                className="w-full h-48 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
              />
            </div>

            {/* Format hints */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supported formats:
              </p>
              <div className="space-y-1">
                <p>• One movie per line</p>
                <p>• Comma-separated: Movie 1, Movie 2, Movie 3</p>
                <p>• JSON: ["Movie 1", "Movie 2"]</p>
              </div>
            </div>

            {/* Errors */}
            {parseErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Errors:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                  {parseErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={handleClose} variant="danger" size="lg">
                Cancel
              </Button>
              <Button
                onClick={() => void handleSearch()}
                disabled={!pastedText.trim()}
                variant="primary"
                size="lg"
              >
                Search Movies
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Searching */}
        {step === "searching" && searchProgress && (
          <div className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-primary mx-auto mb-6"></div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Searching movies...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {searchProgress.current} of {searchProgress.total} (
                {searchProgress.percentage}%)
              </p>
              {/* Progress bar */}
              <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${searchProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === "review" && summary && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 dark:border-primary/30 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                Search Results
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Total:
                  </span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {summary.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Exact matches:
                  </span>
                  <span className="text-green-900 dark:text-green-300 font-semibold">
                    {summary.exact}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                    Fuzzy matches:
                  </span>
                  <span className="text-yellow-900 dark:text-yellow-300 font-semibold">
                    {summary.fuzzy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700 dark:text-red-400 font-medium">
                    Not found:
                  </span>
                  <span className="text-red-900 dark:text-red-300 font-semibold">
                    {summary.notFound}
                  </span>
                </div>
                {summary.errors > 0 && (
                  <div className="col-span-2 flex justify-between">
                    <span className="text-red-700 dark:text-red-400 font-medium">
                      Errors:
                    </span>
                    <span className="text-red-900 dark:text-red-300 font-semibold">
                      {summary.errors}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-primary/20 dark:border-primary/30">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedResults.size}
                  </span>{" "}
                  selected for import
                </p>
              </div>
            </div>

            {/* Results table */}
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        <input
                          type="checkbox"
                          checked={
                            selectedResults.size ===
                            searchResults.filter((r) => r.movie).length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResults(
                                new Set(
                                  searchResults
                                    .map((_, i) => i)
                                    .filter((i) => searchResults[i].movie)
                                )
                              );
                            } else {
                              setSelectedResults(new Set());
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Search Query
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Match
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((result, index) => (
                      <tr
                        key={index}
                        className={
                          selectedResults.has(index)
                            ? "bg-primary/10 dark:bg-primary/20"
                            : ""
                        }
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedResults.has(index)}
                            onChange={() => toggleResult(index)}
                            disabled={!result.movie}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {result.query}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {result.movie ? (
                            <div className="flex items-center space-x-2">
                              {result.movie.poster_url && (
                                <img
                                  src={result.movie.poster_url}
                                  alt={result.movie.title}
                                  className="w-8 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {result.movie.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {result.movie.subtitle}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {result.status === "exact" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Exact
                            </span>
                          )}
                          {result.status === "fuzzy" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Fuzzy
                            </span>
                          )}
                          {result.status === "not_found" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Not Found
                            </span>
                          )}
                          {result.status === "error" && (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              title={result.error}
                            >
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => setStep("input")}
                variant="subtle"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={() => void handleImport()}
                disabled={selectedResults.size === 0}
                variant="primary"
                size="lg"
              >
                Import {selectedResults.size}{" "}
                {selectedResults.size === 1 ? "Movie" : "Movies"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === "importing" && (
          <div className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-primary mx-auto mb-6"></div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Adding movies to watchlist...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This may take a moment
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && batchAddMutation.data && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Import Complete!
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-green-900 dark:text-green-300">
                      Successfully added:
                    </span>{" "}
                    <span className="text-green-700 dark:text-green-400">
                      {batchAddMutation.data.successful.length}
                    </span>
                  </p>
                  {batchAddMutation.data.duplicates.length > 0 && (
                    <p>
                      <span className="font-medium text-yellow-900 dark:text-yellow-300">
                        Skipped (duplicates):
                      </span>{" "}
                      <span className="text-yellow-700 dark:text-yellow-400">
                        {batchAddMutation.data.duplicates.length}
                      </span>
                    </p>
                  )}
                  {batchAddMutation.data.errors.length > 0 && (
                    <p>
                      <span className="font-medium text-red-900 dark:text-red-300">
                        Errors:
                      </span>{" "}
                      <span className="text-red-700 dark:text-red-400">
                        {batchAddMutation.data.errors.length}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} variant="primary" size="lg">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
