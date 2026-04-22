import { useEffect } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'

function injectSnippet(raw: string, where: 'head' | 'body') {
  const html = (raw || '').trim()
  if (!html) return () => {}
  const parser = new DOMParser()
  const parsed = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = parsed.body.firstElementChild
  if (!root) return () => {}

  const nodes: Node[] = []
  for (const child of Array.from(root.childNodes)) {
    const next = child.cloneNode(true)
    nodes.push(next)
  }
  const target = where === 'head' ? document.head : document.body
  for (const node of nodes.reverse()) {
    target.insertBefore(node, target.firstChild)
  }
  return () => {
    for (const node of nodes) {
      if (node.parentNode) node.parentNode.removeChild(node)
    }
  }
}

export function AnalyticsSnippets() {
  const { loading, analyticsYandex } = useSiteSettings()

  useEffect(() => {
    if (loading) return
    const cleanupHead = injectSnippet(analyticsYandex.headSnippet ?? '', 'head')
    const cleanupBody = injectSnippet(analyticsYandex.bodyStartSnippet ?? '', 'body')
    return () => {
      cleanupHead()
      cleanupBody()
    }
  }, [loading, analyticsYandex.headSnippet, analyticsYandex.bodyStartSnippet])

  return null
}
