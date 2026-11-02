import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Notice } from '../Notice/Notice'
import { Page } from '../Page/Page'

type Props = { children: ReactNode }
type State = { failed: boolean }

// Last safety net: if something in the page crashes while rendering,
// show a message instead of a blank screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Page>
        <Notice tone="error" retryLabel="Reload page" onRetry={() => window.location.reload()}>
          Something went wrong while showing this page.
        </Notice>
      </Page>
    )
  }
}
