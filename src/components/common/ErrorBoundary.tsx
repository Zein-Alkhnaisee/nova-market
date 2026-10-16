import { Component, type ErrorInfo, type ReactNode } from "react";
import { CrashPage } from "./CrashPage";

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * When this value changes after a crash, the boundary clears itself and tries
   * to render its children again. Route boundaries pass the pathname, so leaving
   * a crashed page recovers without a reload.
   */
  resetKey?: string;
  /** Use the viewport-filling crash page (app level) instead of the in-shell one. */
  fullPage?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  resetKey: string | undefined;
}

/**
 * Catches errors thrown while rendering (including a failed lazy-route chunk
 * load) in its subtree and shows a designed page instead of a blank screen.
 * It does not catch errors in event handlers or async code — those are handled
 * where they happen (RTK Query error states, form validation, etc.).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] caught a render error", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <CrashPage fullPage={this.props.fullPage} />;
    return this.props.children;
  }
}
