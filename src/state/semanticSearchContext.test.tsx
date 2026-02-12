import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SemanticSearchProvider, useSemanticSearchModal } from './semanticSearchContext'

function TestConsumer() {
  const { isOpen, openModal, closeModal } = useSemanticSearchModal()
  return (
    <div>
      <span data-testid="is-open">{String(isOpen)}</span>
      <button type="button" onClick={openModal} data-testid="open">
        Open
      </button>
      <button type="button" onClick={closeModal} data-testid="close">
        Close
      </button>
    </div>
  )
}

describe('SemanticSearchProvider / useSemanticSearchModal', () => {
  it('provides isOpen false initially', () => {
    render(
      <SemanticSearchProvider>
        <TestConsumer />
      </SemanticSearchProvider>,
    )
    expect(screen.getByTestId('is-open')).toHaveTextContent('false')
  })

  it('openModal sets isOpen to true', async () => {
    const user = userEvent.setup()
    render(
      <SemanticSearchProvider>
        <TestConsumer />
      </SemanticSearchProvider>,
    )
    await act(async () => {
      await user.click(screen.getByTestId('open'))
    })
    expect(screen.getByTestId('is-open')).toHaveTextContent('true')
  })

  it('closeModal sets isOpen to false', async () => {
    const user = userEvent.setup()
    render(
      <SemanticSearchProvider>
        <TestConsumer />
      </SemanticSearchProvider>,
    )
    await act(async () => {
      await user.click(screen.getByTestId('open'))
    })
    await act(async () => {
      await user.click(screen.getByTestId('close'))
    })
    expect(screen.getByTestId('is-open')).toHaveTextContent('false')
  })

  it('useSemanticSearchModal returns no-ops when outside provider', () => {
    render(<TestConsumer />)
    expect(screen.getByTestId('is-open')).toHaveTextContent('false')
    // open/close should not throw
    act(() => {
      screen.getByTestId('open').click()
    })
    expect(screen.getByTestId('is-open')).toHaveTextContent('false')
  })
})
