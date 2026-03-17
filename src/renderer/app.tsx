import { QueryClientProvider, useQuery } from "@tanstack/react-query";

import { queryClient, trpc } from "./lib/trpc";
import { AppLayout } from "./components/app-layout";
import { EnvCheck } from "./components/env-check";
import { Spinner } from "@/components/ui/spinner";

function AppContent() {
  const envQuery = useQuery(trpc.env.check.queryOptions());

  // Loading state
  if (envQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-root">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  // Environment check
  if (envQuery.data) {
    const { ghVersion, gitVersion, ghAuth } = envQuery.data;
    if (!ghVersion || !gitVersion || !ghAuth) {
      return (
        <EnvCheck ghVersion={ghVersion} gitVersion={gitVersion} ghAuth={ghAuth} />
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
