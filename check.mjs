import { chromium } from 'playwright'
const SC = 'C:/Users/user/AppData/Local/Temp/claude/c--srfaso/0a57e199-f6bd-43f8-9d36-2aa3a7bbf46a/scratchpad'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const errs = []
p.on('console', m => m.type() === 'error' && errs.push(m.text()))
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
await p.goto('http://localhost:3123/', { waitUntil: 'networkidle' })

// tap sur le bouton ☰ du rail
await p.locator('nav[aria-label="Catégories de produits"] button').first().tap()
await p.waitForTimeout(400)
const rail = p.locator('nav[aria-label="Catégories de produits"]')
console.log('après tap ☰ — bbox rail :', await rail.boundingBox())
console.log('libellé visible :', await p.locator('text=Toutes les catégories').first().isVisible())
await p.screenshot({ path: SC + '/mobile-rail-open.png' })

// contrôle de débordement horizontal sur les pages clés
for (const url of ['/', '/produits', '/produits/batterie-moto-12v-7ah', '/panier']) {
  await p.goto('http://localhost:3123' + url, { waitUntil: 'networkidle' })
  const o = await p.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }))
  console.log(url, '→ scrollWidth', o.scroll, '/ viewport', o.inner, o.scroll > o.inner ? '⚠ DÉBORDE' : 'ok')
}
console.log('erreurs console :', errs.length ? errs : 'aucune')
await b.close()
