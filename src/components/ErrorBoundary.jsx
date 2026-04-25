import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div className="text-center flex flex-col gap-1">
            <p className="text-gray-900 dark:text-white text-base font-semibold">Something went wrong</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Please refresh the page to continue.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
