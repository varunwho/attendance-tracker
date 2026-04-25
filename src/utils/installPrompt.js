// Module-level singleton so both InstallPrompt.jsx and Settings.jsx share the same event

let _deferred = null
const _subs   = new Set()

function notify() { _subs.forEach(fn => fn(_deferred)) }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    _deferred = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    _deferred = null
    notify()
  })
}

/** Subscribe to deferred-prompt changes. Returns an unsubscribe function. */
export function subscribeInstallPrompt(fn) {
  _subs.add(fn)
  fn(_deferred) // immediate call with current value
  return () => _subs.delete(fn)
}

/** Trigger the native install flow. Returns 'accepted' | 'dismissed' | null */
export async function triggerInstall() {
  if (!_deferred) return null
  _deferred.prompt()
  const { outcome } = await _deferred.userChoice
  _deferred = null
  notify()
  return outcome
}

export function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isStandalone() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}
