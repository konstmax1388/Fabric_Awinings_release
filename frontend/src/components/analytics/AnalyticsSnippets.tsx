import { useEffect } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'

function materializeNode(node: Node): Node {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return node.cloneNode(true)
  }
  const el = node as HTMLElement
  if (el.tagName.toLowerCase() === 'script') {
    const script = document.createElement('script')
    for (const attr of Array.from(el.attributes)) {
      script.setAttribute(attr.name, attr.value)
    }
    script.text = el.textContent || ''
    return script
  }
  const copy = el.cloneNode(false) as HTMLElement
  for (const child of Array.from(el.childNodes)) {
    copy.appendChild(materializeNode(child))
  }
  return copy
}

function injectSnippet(raw: string, where: 'head' | 'body') {
  const html = (raw || '').trim()
  if (!html) return () => {}
  const parser = new DOMParser()
  const parsed = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = parsed.body.firstElementChild
  if (!root) return () => {}

  const nodes: Node[] = []
  for (const child of Array.from(root.childNodes)) {
    const next = materializeNode(child)
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

function injectSnippetBodyEnd(raw: string) {
  const html = (raw || '').trim()
  if (!html) return () => {}
  const parser = new DOMParser()
  const parsed = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = parsed.body.firstElementChild
  if (!root) return () => {}
  const nodes: Node[] = []
  for (const child of Array.from(root.childNodes)) {
    nodes.push(materializeNode(child))
  }
  for (const node of nodes) {
    document.body.appendChild(node)
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

  useEffect(() => {
    if (loading) return
    return injectSnippetBodyEnd(analyticsYandex.bodyEndSnippet ?? '')
  }, [loading, analyticsYandex.bodyEndSnippet])

  useEffect(() => {
    if (loading) return
    const root = document.documentElement
    const has = Boolean((analyticsYandex.bodyEndSnippet ?? '').trim())
    if (has) root.classList.add('fabric-has-body-end-widget')
    else root.classList.remove('fabric-has-body-end-widget')
    return () => {
      root.classList.remove('fabric-has-body-end-widget')
    }
  }, [loading, analyticsYandex.bodyEndSnippet])

  return null
}
