import { chromium } from 'playwright'
const SC = 'C:/Users/user/AppData/Local/Temp/claude/c--srfaso/0a57e199-f6bd-43f8-9d36-2aa3a7bbf46a/scratchpad'
const b = await chromium.launch()
for (const vp of [{w:320,h:568},{w:360,h:740},{w:414,h:896},{w:768,h:1024}]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true })
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 })
  const rail = p.locator('nav[aria-label="Catégories de produits"]')
  const bb = await rail.boundingBox()
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  console.log(`${vp.w}px → rail`, bb ? `${bb.width}px` : 'ABSENT', '| débordement horizontal :', ov)
  await p.close()
}
// navigation client puis contrôle du rail
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 })
await p.locator('a[href="/produits"]').first().tap()
await p.waitForURL('**/produits', { timeout: 30000 })
await p.waitForTimeout(1500)
console.log('après navigation client → rail :', await p.locator('nav[aria-label="Catégories de produits"]').boundingBox())
await p.screenshot({ path: SC + '/mobile-produits.png' })
await b.close()
