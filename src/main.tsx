import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/theme.css";
import "./index.css";
import App from "./App";
import { validateEnv } from "./lib/validateEnv";
import { logger, logError } from "./lib/logger";
import { parseSupabaseError } from "./utils/errorUtils";
import GlobalErrorNotifications from "./components/shared/ui/GlobalErrorNotifications";

// Import global error store (will be initialized in bootstrap)
let showError:
  | ((
      error: unknown,
      options?: { duration?: number; persistent?: boolean }
    ) => void)
  | null = null;

// Lazy import to avoid circular dependencies
import("./hooks/useGlobalError").then((module) => {
  const { globalErrorStore } = module;
  showError = (error: unknown, options = {}) => {
    // Parse error message
    let message: string;
    if (typeof error === "string") {
      message = error;
    } else {
      const parsed = parseSupabaseError(error);
      message = parsed.message;
    }
    // Call store's addError directly
    globalErrorStore.getState().addError(message, options);
  };
});

// Bootstrap function to initialize the app
function bootstrap() {
  // Validate environment variables before starting the app
  try {
    validateEnv();
  } catch (error) {
    logger.error("Failed to start app due to invalid environment", { error });
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="color: #ef4444; margin-bottom: 16px;">⚠️ Configuration Error</h1>
          <p style="color: #6b7280; margin-bottom: 8px;">The application is missing required environment variables.</p>
          <p style="color: #6b7280;">Check the browser console for details.</p>
        </div>
      </div>
    `;
    throw error;
  }

  // Create a client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const parsed = parseSupabaseError(error);
          // Retry up to 2 times if error is retryable
          return parsed.shouldRetry && failureCount < 2;
        },
        onError: (error: unknown) => {
          const parsed = parseSupabaseError(error);

          // Don't show toast for auth errors (handled separately)
          if (!parsed.isAuth && showError) {
            showError(error, { duration: 5000, persistent: false });
          }

          // Log all query errors
          logError(error, { component: "Query" });
        },
      },
      mutations: {
        retry: false,
        onError: (error: unknown) => {
          // Show persistent alert for mutation errors
          if (showError) {
            showError(error, { persistent: true });
          }

          // Log mutation errors with higher priority
          logError(error, { component: "Mutation" });
        },
      },
    },
  });

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <GlobalErrorNotifications />
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

// Only run bootstrap in browser context
if (typeof document !== "undefined") {
  bootstrap();
}
