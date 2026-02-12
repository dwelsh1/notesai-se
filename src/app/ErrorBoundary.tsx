import { Component } from 'react'

type ErrorBoundaryProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div data-testid="error-boundary">
            <h2>Something went wrong.</h2>
            <p>Try reloading the app.</p>
            <button type="button" title="Reload the app" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
