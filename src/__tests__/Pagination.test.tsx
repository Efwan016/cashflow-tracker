import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { Pagination } from '../component/components/Pagination'

describe('Pagination component', () => {
  test('renders nothing when total pages <= 1', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination currentPage={1} totalItems={5} itemsPerPage={10} onPageChange={onPageChange} />
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders pages and handles navigation', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={2} totalItems={50} itemsPerPage={10} onPageChange={onPageChange} />)

    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Previous page'))
    expect(onPageChange).toHaveBeenLastCalledWith(1)

    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenLastCalledWith(3)

    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }))
    expect(onPageChange).toHaveBeenLastCalledWith(4)
  })

  test('disables previous on first page and next on last page', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Pagination currentPage={1} totalItems={40} itemsPerPage={10} onPageChange={onPageChange} />
    )

    expect(screen.getByLabelText('Previous page')).toBeDisabled()
    expect(screen.getByLabelText('Next page')).not.toBeDisabled()

    rerender(<Pagination currentPage={4} totalItems={40} itemsPerPage={10} onPageChange={onPageChange} />)

    expect(screen.getByLabelText('Previous page')).not.toBeDisabled()
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })
})
