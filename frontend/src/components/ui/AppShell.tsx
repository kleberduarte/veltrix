'use client'

import ErrorBoundary from './ErrorBoundary'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
