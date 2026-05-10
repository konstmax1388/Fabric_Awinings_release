/**
 * Статический prerender после `vite build`: Playwright открывает маршруты из
 * `frontend/prerender-paths.json`, запросы /api, /media, /static уходят на PRERENDER_UPSTREAM.
 *
 * Без файла списка, SKIP_PRERENDER=1 или недоступного upstream — выход 0 (сайт как SPA).
 */
import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.join(__dirname, '..')
const distDir = path.join(frontendRoot, 'dist')
const pathsFile = path.join(frontendRoot, 'prerender-paths.json')
const previewPort = String(process.env.PRERENDER_PREVIEW_PORT || '4179').replace(/[^0-9]/g, '') || '4179'
const previewOrigin = `http://127.0.0.1:${previewPort}`
const upstream = (process.env.PRERENDER_UPSTREAM || 'http://127.0.0.1:19999').replace(/\/$/, '')
const perPageTimeoutMs = Number(process.env.PRERENDER_PAGE_TIMEOUT_MS || 90000)

function log(...args) {
  console.log('[prerender]', ...args)
}

function warn(...args) {
  console.warn('[prerender]', ...args)
}

async function upstreamHealthy() {
  try {
    const r = await fetch(`${upstream}/api/health/`, { signal: AbortSignal.timeout(8000) })
    return r.ok
  } catch {
    return false
  }
}

function killPreview(proc) {
  if (!proc || proc.exitCode != null) return
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    } else {
      proc.kill('SIGTERM')
    }
  } catch {
    // ignore
  }
}

async function main() {
  if (process.env.SKIP_PRERENDER === '1') {
    log('SKIP_PRERENDER=1 — пропуск.')
    return
  }
  if (!fs.existsSync(pathsFile)) {
    log('Нет prerender-paths.json — пропуск (python manage.py export_prerender_paths).')
    return
  }
  let paths
  try {
    paths = JSON.parse(fs.readFileSync(pathsFile, 'utf8'))
  } catch (e) {
    warn('Битый JSON в prerender-paths.json — пропуск:', e instanceof Error ? e.message : e)
    return
  }
  if (!Array.isArray(paths) || paths.length === 0) {
    log('Пустой список путей — пропуск.')
    return
  }
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('Нет dist/index.html — сначала vite build.')
  }

  if (!(await upstreamHealthy())) {
    warn(`Upstream ${upstream} недоступен (/api/health/) — пропуск prerender (остаётся SPA shell).`)
    return
  }

  const viteCmd = `npx vite preview --host 127.0.0.1 --port ${previewPort} --strictPort`
  const vitePreview = spawn(viteCmd, {
    cwd: frontendRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })

  let browser
  try {
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`${previewOrigin}/`, { signal: AbortSignal.timeout(2000) })
        if (res.ok) break
      } catch {
        /* ждём подъёма preview */
      }
      await new Promise((r) => setTimeout(r, 500))
      if (vitePreview.exitCode != null) {
        throw new Error(`vite preview завершился до старта (код ${vitePreview.exitCode})`)
      }
    }

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.route('**/*', async (route) => {
      const req = route.request()
      const url = req.url()
      if (!url.startsWith(previewOrigin)) {
        return route.continue()
      }
      const u = new URL(url)
      if (
        u.pathname.startsWith('/api') ||
        u.pathname.startsWith('/media') ||
        u.pathname.startsWith('/static')
      ) {
        const newUrl = `${upstream}${u.pathname}${u.search}`
        try {
          const res = await route.fetch({ url: newUrl })
          await route.fulfill({ response: res })
        } catch (e) {
          warn('proxy error', newUrl, e instanceof Error ? e.message : e)
          await route.abort()
        }
        return
      }
      return route.continue()
    })

    let ok = 0
    for (const p of paths) {
      if (typeof p !== 'string' || !p.startsWith('/')) {
        warn('пропуск пути (ожидается строка с /):', p)
        continue
      }
      const url = `${previewOrigin}${p === '/' ? '/' : p}`
      log('→', url)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: perPageTimeoutMs })
      await page.waitForFunction(
        () => (document.getElementById('root')?.textContent?.length ?? 0) > 40,
        { timeout: Math.min(perPageTimeoutMs, 60000) },
      )
      const html = await page.content()
      const rel = p === '/' ? 'index.html' : path.join(...p.split('/').filter(Boolean), 'index.html')
      const out = path.join(distDir, rel)
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, html, 'utf8')
      ok += 1
    }
    log(`Готово: ${ok}/${paths.length} страниц.`)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
    killPreview(vitePreview)
    await new Promise((r) => setTimeout(r, 1500))
  }
}

main().catch((e) => {
  warn('ошибка:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
