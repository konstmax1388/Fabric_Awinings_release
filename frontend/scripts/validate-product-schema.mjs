import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function run() {
  const target = resolve(process.cwd(), 'src/pages/ProductPage.tsx')
  const src = await readFile(target, 'utf8')
  const required = [
    "'@type': 'Product'",
    "'@type': 'Offer'",
    "priceCurrency: 'RUB'",
    "availability: 'https://schema.org/InStock'",
    "'@type': 'ImageObject'",
  ]
  const missing = required.filter((token) => !src.includes(token))
  if (missing.length) {
    throw new Error(`Schema smoke failed, missing tokens: ${missing.join(', ')}`)
  }
  process.stdout.write('Product schema smoke passed.\n')
}

run().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(1)
})
