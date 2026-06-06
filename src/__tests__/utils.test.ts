import { getPageRange, createNumberFormatter, createCurrencyFormatter, getLocalDate, getTzOffset, formatDateTimeLocal, toDateKey, ago } from '../lib/utils'

describe('utils', () => {
  test('getPageRange small totals', () => {
    expect(getPageRange(1, 3)).toEqual([1, 2, 3])
  })

  test('getPageRange with ellipsis when current near start', () => {
    expect(getPageRange(2, 10)).toEqual([1, 2, 3, 4, 5, '...', 10])
  })

  test('getPageRange with ellipsis near last pages', () => {
    expect(getPageRange(9, 10)).toEqual([1, '...', 6, 7, 8, 9, 10])
  })

  test('createNumberFormatter formats numbers based on navigator.language', () => {
    const original = navigator.language
    try {
      Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
      const fmt = createNumberFormatter()
      expect(fmt.format(1000)).toMatch(/1,000|1\u202f000/)
    } finally {
      Object.defineProperty(navigator, 'language', { value: original })
    }
  })

  test('createCurrencyFormatter formats currency from active app language', () => {
    expect(createCurrencyFormatter('id').format(1000)).toMatch(/IDR|Rp/)
    expect(createCurrencyFormatter('en').format(1000)).toMatch(/\$|USD/)
    expect(createCurrencyFormatter('zh').format(1000)).toContain('CN¥')
    expect(createCurrencyFormatter('ja').format(1000)).toContain('JP¥')
  })

  test('createCurrencyFormatter converts base IDR amounts with a supplied rate', () => {
    expect(createCurrencyFormatter('en', 1 / 18000).format(18000)).toMatch(/\$1|USD\s?1/)
  })

  test('getLocalDate returns today in en-CA format', () => {
    expect(getLocalDate()).toBe(new Date().toLocaleDateString('en-CA'))
  })

  test('getTzOffset returns a signed timezone offset', () => {
    expect(getTzOffset()).toMatch(/^[+-]\d{2}:\d{2}$/)
  })

  test('formatDateTimeLocal returns a datetime string with timezone offset', () => {
    const value = formatDateTimeLocal(new Date('2024-01-01T12:34:56Z'))
    expect(value).toMatch(/^2024-01-01T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
  })

  test('toDateKey returns an ISO date key string', () => {
    expect(toDateKey('2024-01-01T12:34:56Z')).toBe('2024-01-01')
  })

  test('ago returns expected relative strings', () => {
    const now = Date.now()
    const oneMinuteAgo = new Date(now - 30 * 1000).toISOString()
    expect(ago(oneMinuteAgo)).toBe('just now')

    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString()
    expect(ago(fiveMinutesAgo)).toBe('5m ago')

    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString()
    expect(ago(twoHoursAgo)).toBe('2h ago')
  })
})
