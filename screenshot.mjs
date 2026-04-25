/**
 * screenshot.mjs
 * Takes screenshots of every tab in both dark and light mode.
 *
 * Usage:
 *   1. Make sure the dev server is running: npm run dev
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

const TABS = [
  { id: 'dashboard', label: 'Dashboard', navIndex: 0 },
  { id: 'calendar',  label: 'Calendar',  navIndex: 1 },
  { id: 'holidays',  label: 'Holidays',  navIndex: 2 },
  { id: 'settings',  label: 'Settings',  navIndex: 3 },
]

// Extra shots beyond the basic 4 tabs
const EXTRAS = [
  {
    id: 'drag-select',
    label: 'Drag Select',
    theme: 'dark',
    async capture(page) {
      // Go to calendar tab
      await page.locator('nav button').nth(1).click()
      await page.waitForTimeout(300)
      // Simulate drag across a few days to trigger selection
      const grid = page.locator('.grid.grid-cols-7')
      const cells = grid.locator('[data-iso]')
      const count = await cells.count()
      if (count >= 5) {
        const from = await cells.nth(2).boundingBox()
        const to   = await cells.nth(6).boundingBox()
        if (from && to) {
          await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
          await page.mouse.down()
          await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 })
          // Don't release — keep action bar visible
          await page.waitForTimeout(400)
          await page.screenshot({ path: path.join(OUT_DIR, 'drag-select.png') })
          await page.mouse.up()
          return true
        }
      }
      return false
    },
  },
  {
    id: 'summary',
    label: 'Month Summary',
    theme: 'dark',
    async capture(page) {
      await page.locator('nav button').nth(1).click()
      await page.waitForTimeout(300)
      // Scroll to bottom of calendar to show the summary card
      await page.evaluate(() => {
        const main = document.querySelector('main')
        if (main) main.scrollTop = main.scrollHeight
      })
      await page.waitForTimeout(300)
      await page.screenshot({ path: path.join(OUT_DIR, 'summary.png') })
      return true
    },
  },
]

async function setTheme(page, theme) {
  // Toggle theme via localStorage so we don't have to click through Settings
  await page.evaluate((t) => {
    const key  = 'attendance_settings'
    const raw  = localStorage.getItem(key)
    const data = raw ? JSON.parse(raw) : {}
    localStorage.setItem(key, JSON.stringify({ ...data, theme: t }))
  }, theme)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
}

async function seedData(page) {
  // Add some attendance records so dashboard & calendar look populated
  await page.evaluate(() => {
    const key  = 'attendance_settings'
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ period: 'monthly', type: 'percentage', value: 50, theme: 'dark' }))
    }
  })

  // Open IndexedDB and write some present/absent records for this month
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const req = indexedDB.open('AttendanceTracker')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('attendance', 'readwrite')
        const store = tx.objectStore('attendance')

        const today = new Date()
        const year  = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')

        const records = []
        for (let d = 1; d < today.getDate(); d++) {
          const dow  = new Date(year, today.getMonth(), d).getDay()
          if (dow === 0 || dow === 6) continue
          const iso    = `${year}-${month}-${String(d).padStart(2, '0')}`
          const status = d % 4 === 0 ? 'absent' : 'present'
          records.push({ date: iso, status })
        }

        let i = 0
        function next() {
          if (i >= records.length) { resolve(); return }
          const r = store.put(records[i++])
          r.onsuccess = next
          r.onerror   = next
        }
        next()
      }
      req.onerror = resolve
    })
  })

  // Add a holiday
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const req = indexedDB.open('AttendanceTracker')
      req.onsuccess = () => {
        const db    = req.result
        const tx    = db.transaction('holidays', 'readwrite')
        const store = tx.objectStore('holidays')
        const today = new Date()
        const d15   = new Date(today.getFullYear(), today.getMonth(), 15)
        const iso   = `${d15.getFullYear()}-${String(d15.getMonth()+1).padStart(2,'0')}-15`
        store.add({ date: iso, label: 'Company Holiday' })
        tx.oncomplete = resolve
        tx.onerror    = resolve
      }
      req.onerror = resolve
    })
  })

  // Reload to pick up seeded data
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,   // retina quality
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const page = await context.newPage()

  console.log('Opening app…')
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  console.log('Seeding demo data…')
  await seedData(page)

  for (const theme of ['dark', 'light']) {
    console.log(`\nShooting ${theme} mode…`)
    await setTheme(page, theme)

    for (const tab of TABS) {
      await page.locator('nav button').nth(tab.navIndex).click()
      await page.waitForTimeout(400)

      // Scroll to top before shooting
      await page.evaluate(() => {
        const main = document.querySelector('main')
        if (main) main.scrollTop = 0
      })
      await page.waitForTimeout(150)

      const filename = tab.navIndex === 0 && theme === 'dark'  ? 'dashboard.png'
                     : tab.navIndex === 0 && theme === 'light' ? 'light.png'
                     : tab.navIndex === 3 && theme === 'dark'  ? 'settings.png'
                     : tab.navIndex === 3 && theme === 'light' ? 'dark.png'
                     : `${tab.id}${theme === 'light' ? '-light' : ''}.png`

      const outPath = path.join(OUT_DIR, filename)
      await page.screenshot({ path: outPath })
      console.log(`  ✓ ${outPath}`)
    }
  }

  // Dedicated shots
  console.log('\nShooting extras…')
  await setTheme(page, 'dark')
  for (const extra of EXTRAS) {
    const ok = await extra.capture(page)
    if (ok) console.log(`  ✓ docs/screenshots/${extra.id}.png`)
  }

  await browser.close()
  console.log('\nDone. Screenshots saved to docs/screenshots/')
}

run().catch(err => { console.error(err); process.exit(1) })
