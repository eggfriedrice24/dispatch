import { Spinner } from "@/components/ui/spinner";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";

import { AppLayout } from "./components/app-layout";
import { EnvCheck } from "./components/env-check";
import { queryClient, trpc } from "./lib/trpc";

function AppContent() {
  const envQuery = useQuery(trpc.env.check.queryOptions());

  // Loading state
  if (envQuery.isLoading) {
    return (
      <div className="bg-bg-root flex h-screen items-center justify-center">
        <Spinner className="text-primary h-6 w-6" />
      </div>
    );
  }

  // Environment check
  if (envQuery.data) {
    const { ghVersion, gitVersion, ghAuth } = envQuery.data;
    if (!ghVersion || !gitVersion || !ghAuth) {
      return (
        <EnvCheck
          ghVersion={ghVersion}
          gitVersion={gitVersion}
          ghAuth={ghAuth}
        />
      );
    }
  }

  return <AppLayout />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
