import type { ErrorInfo, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Component, useCallback, useState } from "react";

import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { Navbar } from "./navbar";
import { PrDetailView } from "./pr-detail-view";
import { PrInbox } from "./pr-inbox";

/**
 * Root layout matching DISPATCH-DESIGN-SYSTEM.md § 4.2:
 *
 *  +--[ Accent Bar (2px) ]--+
 *  |      Navbar (42px)     |
 *  +------+-----------------+
 *  | Side |   Main Content  |
 *  | bar  |   (flex: 1)     |
 *  | 260px|                 |
 *  +------+-----------------+
 */
export function AppLayout() {
  const [selectedPr, setSelectedPr] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "b",
      modifiers: ["meta"],
      handler: toggleSidebar,
    },
  ]);

  return (
    <ErrorBoundary>
      <div className="bg-bg-root text-text-primary relative flex h-screen flex-col overflow-hidden">
        {/* Background noise texture (§ 4.4) */}
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            opacity: 0.015,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />

        {/* Accent bar — 2px copper gradient at the very top (§ 4.3) */}
        <div
          className="h-[2px] w-full shrink-0"
          style={{
            background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
            opacity: 0.4,
          }}
        />

        {/* Navbar — 40px (42px total with accent bar) */}
        <Navbar selectedPr={selectedPr} />

        {/* Main body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* PR Inbox Sidebar (§ 8.4) — 260px, collapsible with Cmd+B (§ 10.4) */}
          <div
            className="shrink-0 overflow-hidden transition-[width]"
            style={{
              width: sidebarCollapsed ? 0 : 260,
              transitionDuration: "400ms",
              transitionTimingFunction: "var(--ease-out)",
            }}
          >
            <PrInbox
              selectedPr={selectedPr}
              onSelectPr={setSelectedPr}
            />
          </div>

          {/* Main content area */}
          <main className="flex flex-1 flex-col overflow-hidden">
            <PrDetailView prNumber={selectedPr} />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Error Boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error, info);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="bg-bg-root flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="font-heading text-text-primary text-3xl italic">Something went wrong</h1>
          <p className="text-text-secondary max-w-md text-center text-[13px]">
            {this.state.error.message}
          </p>
          <Button
            onClick={() => {
              this.setState({ error: null });
            }}
            className="bg-primary text-primary-foreground hover:bg-accent-hover"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
