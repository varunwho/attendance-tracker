/**
 * screenshot.mjs
 * Captures screenshots of every tab and key interactions in dark + light mode.
 *
 * Usage:
 *   1. npm run dev   (keep running)
 *   2. node screenshot.mjs
 *
 * Output: docs/screenshots/*.png
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR  = 'docs/screenshots'

// iPhone 14 Pro dimensions
const VIEWPORT = { width: 393, height: 852 }

async function setTheme(page, theme) {
  await page.evaluate(t => {
    const key  = 'attendance_settings'
    const raw  = localStorage.getItem(key)
    const data = raw ? JSON.parse(raw) : {}
    localStorage.setItem(key, JSON.stringify({ ...data, theme: t }))
  }, theme)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

async function goTab(page, index) {
  await page.locator('nav button').nth(index).click()
  await page.waitForTimeout(350)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTop = 0
  })
  await page.waitForTimeout(150)
}

async function shot(page, filename) {
  const outPath = path.join(OUT_DIR, filename)
  await page.screenshot({ path: outPath })
  console.log(`  ✓ ${outPath}`)
}

async function seedData(page) {
  await page.evaluate(() => {
    const key = 'attendance_settings'
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({
        period: 'monthly', type: 'percentage', value: 75, theme: 'dark', quarterStart: 3,
      }))
    } else {
      const data = JSON.parse(localStorage.getItem(key))
      localStorage.setItem(key, JSON.stringify({ ...data, period: 'monthly', value: 75, quarterStart: 3 }))
    }
    // Dismiss the install prompt so it doesn't block nav clicks
    localStorage.setItem('install_prompt_dismissed', '1')
  })

  // Seed attendance for this month
  await page.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('AttendanceTracker')
    req.onsuccess = () => {
      const db    = req.result
      const tx    = db.transaction('attendance', 'readwrite')
      const store = tx.objectStore('attendance')
      const today = new Date()
      const year  = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      let i = 0
      for (let d = 1; d < today.getDate(); d++) {
        const dow = new Date(year, today.getMonth(), d).getDay()
        if (dow === 0 || dow === 6) continue
        const iso    = `${year}-${month}-${String(d).padStart(2, '0')}`
        const status = d % 5 === 0 ? 'absent' : 'present'
        store.put({ date: iso, status })
        i++
      }
      tx.oncomplete = resolve
      tx.onerror    = resolve
    }
    req.onerror = resolve
  }))

  // Seed a user-added holiday (15th of current month)
  await page.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('AttendanceTracker')
    req.onsuccess = () => {
      const db    = req.result
      const tx    = db.transaction('holidays', 'readwrite')
      const store = tx.objectStore('holidays')
      const today = new Date()
      const iso   = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-15`
      // Only add if not already there
      const check = store.index('date').count(iso)
      check.onsuccess = () => {
        if (check.result === 0) store.add({ date: iso, label: 'Team Outing' })
        tx.oncomplete = resolve
        tx.onerror    = resolve
      }
      check.onerror = resolve
    }
    req.onerror = resolve
  }))

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const page = await context.newPage()

  console.log('Opening app…')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  console.log('Seeding demo data…')
  await seedData(page)

  // ── Dark mode ──────────────────────────────────────────────
  console.log('\n── Dark mode ──')
  await setTheme(page, 'dark')

  await goTab(page, 0); await shot(page, 'dashboard.png')
  await goTab(page, 1); await shot(page, 'calendar.png')
  await goTab(page, 2); await shot(page, 'holidays.png')
  await goTab(page, 3); await shot(page, 'settings.png')

  // Drag-select shot
  console.log('  Shooting drag-select…')
  await goTab(page, 1)
  const cells = page.locator('[data-iso]')
  const count = await cells.count()
  if (count >= 6) {
    const from = await cells.nth(2).boundingBox()
    const to   = await cells.nth(6).boundingBox()
    if (from && to) {
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down()
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 })
      await page.waitForTimeout(350)
      await shot(page, 'drag-select.png')
      await page.mouse.up()
    }
  }

  // Month summary shot (scroll down on calendar)
  console.log('  Shooting month summary…')
  await goTab(page, 1)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTop = main.scrollHeight
  })
  await page.waitForTimeout(300)
  await shot(page, 'summary.png')

  // Settings — scroll to quarter section
  console.log('  Shooting settings-quarter…')
  await goTab(page, 3)
  await page.evaluate(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTop = 300
  })
  await page.waitForTimeout(200)
  await shot(page, 'settings-quarter.png')

  // ── Light mode ────────────────────────────────────────────
  console.log('\n── Light mode ──')
  await setTheme(page, 'light')

  await goTab(page, 0); await shot(page, 'dashboard-light.png')
  await goTab(page, 1); await shot(page, 'calendar-light.png')
  await goTab(page, 2); await shot(page, 'holidays-light.png')
  await goTab(page, 3); await shot(page, 'settings-light.png')

  await browser.close()
  console.log('\nDone. Screenshots saved to', OUT_DIR)
}

run().catch(err => { console.error(err); process.exit(1) })
