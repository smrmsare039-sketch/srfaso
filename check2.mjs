import { chromium } from 'playwright'
const SC = 'C:/Users/user/AppData/Local/Temp/claude/c--srfaso/0a57e199-f6bd-43f8-9d36-2aa3a7bbf46a/scratchpad'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const errs = []
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message))
p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)))
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 120000 })
await p.waitForTimeout(2500)
const rail = p.locator('nav[aria-label="Catégories de produits"]')
console.log('DEV :3000 — rail count :', await rail.count(), '| bbox :', await rail.boundingBox())
console.log('erreurs :', errs.length ? errs.slice(0,5) : 'aucune')
await p.screenshot({ path: SC + '/dev3000-mobile.png' })
await b.close()
