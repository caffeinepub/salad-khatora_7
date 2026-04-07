import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// Disable all automatic background refetching.
// This is critical to prevent "connection lost / reconnecting" loops:
//   - refetchOnWindowFocus: true causes re-fetch on every tab switch
//   - refetchOnReconnect: true causes re-fetch on every network event
//   - staleTime: 0 means every query is immediately stale and will re-fetch
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Number.POSITIVE_INFINITY,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
