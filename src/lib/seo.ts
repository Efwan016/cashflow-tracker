export type SeoConfig = {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  robots?: string
}

const DEFAULT_SEO: Required<SeoConfig> = {
  title: 'Cashflow Tracker | Smart Inventory & Finance Manager',
  description: 'Kelola profit, stok, dan keuangan bisnis modern.',
  canonical: 'https://adzanitech.web.id/',
  ogImage: 'https://adzanitech.web.id/images/Dashboard.png',
  robots: 'index, follow',
}

const applySeo = (config: Required<SeoConfig>) => {
  if (typeof document === 'undefined') return
  document.title = config.title

  const ensureMeta = (name: string, content: string) => {
    let element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
    if (!element) {
      element = document.createElement('meta')
      if (name.startsWith('og:')) {
        element.setAttribute('property', name)
      } else {
        element.setAttribute('name', name)
      }
      document.head.appendChild(element)
    }
    element.setAttribute('content', content)
  }

  const ensureLink = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`)
    if (!element) {
      element = document.createElement('link')
      element.setAttribute('rel', rel)
      document.head.appendChild(element)
    }
    element.setAttribute('href', href)
  }

  ensureMeta('description', config.description)
  ensureMeta('robots', config.robots)
  ensureMeta('og:title', config.title)
  ensureMeta('og:description', config.description)
  ensureMeta('og:image', config.ogImage)
  ensureMeta('og:url', config.canonical)
  ensureMeta('twitter:title', config.title)
  ensureMeta('twitter:description', config.description)
  ensureMeta('twitter:image', config.ogImage)
  ensureLink('canonical', config.canonical)
}

applySeo(DEFAULT_SEO)

export type SeoRouteProps = {
  meta?: SeoConfig
}

export function RouteSeo({ meta }: SeoRouteProps) {
  const config = { ...DEFAULT_SEO, ...(meta ?? {}) }
  applySeo(config)
  return null
}

export function useSeo(meta?: SeoConfig) {
  const config = { ...DEFAULT_SEO, ...(meta ?? {}) }
  applySeo(config)
  return config
}
