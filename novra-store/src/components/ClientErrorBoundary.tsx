"use client";

import { Component, type ReactNode } from "react";
import { useTranslations } from "next-intl";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

function DefaultErrorFallback() {
  const t = useTranslations("errorBoundary");
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
      <p className="text-red-300 text-sm">{t("message")}</p>
    </div>
  );
}

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback />;
    }

    return this.props.children;
  }
}
