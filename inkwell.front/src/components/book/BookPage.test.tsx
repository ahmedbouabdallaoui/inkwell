import { render, screen } from '@testing-library/react'
import { BookPage } from './BookPage'

test('renders page content in serif font container', () => {
  render(<BookPage content="Once upon a time in a land far away..." side="right" />)
  expect(screen.getByText(/Once upon a time/)).toBeInTheDocument()
})

test('renders left page with title metadata', () => {
  render(
    <BookPage
      side="left"
      title="The Dragon Wakes"
      genre="Fantasy"
      createdAt="2026-05-04"
      content=""
    />
  )
  expect(screen.getByText('The Dragon Wakes')).toBeInTheDocument()
  expect(screen.getByText('Fantasy')).toBeInTheDocument()
})
