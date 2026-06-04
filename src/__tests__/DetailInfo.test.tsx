import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import DetailInfo from '../component/pages/Setting/DetailInfo'
import { LanguageProvider } from '../component/providers/LanguageProvider'

vi.mock('../lib/supabase', () => {
  const mockSingle = vi.fn(async () => ({ data: { full_name: 'Test User' } }))
  const mockEq = vi.fn(() => ({ single: mockSingle }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  const mockGetUser = vi.fn(async () => ({
    data: {
      user: {
        id: 'u1',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      },
    },
  }))

  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
        updateUser: vi.fn(async () => ({ error: null })),
        signOut: vi.fn(async () => ({})),
      },
      from: mockFrom,
    },
  }
})

describe('DetailInfo component', () => {
  test('renders account info after loading', async () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <DetailInfo />
        </MemoryRouter>
      </LanguageProvider>
    )

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Account Info')).toBeInTheDocument()
    })

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Member since/i)).toBeInTheDocument()
  })
})
