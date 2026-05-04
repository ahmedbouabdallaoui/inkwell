import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

test('renders left panel and main stage slots', () => {
  render(
    <AppShell
      leftPanel={<div>left</div>}
      mainStage={<div>main</div>}
    />
  )
  expect(screen.getByText('left')).toBeInTheDocument()
  expect(screen.getByText('main')).toBeInTheDocument()
})
