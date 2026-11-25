// Renders public/favicon.svg to the PNG icons the PWA manifest needs.
// Needs Playwright (npm i -D playwright) and a Chromium browser. Run: node scripts/make-icons.cjs
// The PNGs are committed, so this only needs re-running if the icon design changes.
const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const svg = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'), 'utf8')
const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
]

;(async () => {
  const browser = await chromium.launch()
  for (const [name, size] of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    )
    await page.screenshot({ path: path.join(__dirname, '../public', name), omitBackground: false })
    await page.close()
  }
  await browser.close()
})()
