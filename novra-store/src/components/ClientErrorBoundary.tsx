"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-red-300 text-sm">
              Catalogul nu s-a încărcat complet. Reîmprospătează pagina sau folosește meniul de navigare.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
