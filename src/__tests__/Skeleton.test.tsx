import { render } from '@testing-library/react'
import Skeleton from '../component/components/Skeleton'

describe('Skeleton component', () => {
  test('renders correct number of list items', () => {
    const { container } = render(<Skeleton n={3} variant="list" />)
    const wrapper = container.querySelector('.space-y-3')
    const items = wrapper?.querySelectorAll(':scope > div') || []
    expect(items.length).toBe(3)
  })
})
