import { render, screen } from '@testing-library/react'
import { Wordmark } from './Wordmark'

test('renders the Inkwell brand name', () => {
  render(<Wordmark />)
  expect(screen.getByText('Inkwell')).toBeInTheDocument()
})

test('renders the ink drop glyph', () => {
  render(<Wordmark />)
  expect(screen.getByText('◆')).toBeInTheDocument()
})
