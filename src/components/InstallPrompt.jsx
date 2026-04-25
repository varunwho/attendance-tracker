import { useState, useEffect } from 'react'
import { subscribeInstallPrompt, triggerInstall, isIOSDevice, isStandalone } from '../utils/installPrompt'

const DISMISSED_KEY = 'install_prompt_dismissed'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow]         = useState(false)
  const [ios]                   = useState(isIOSDevice)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return

    if (ios) {
      const t = setTimeout(() => setShow(true), 2500)
      return () => clearTimeout(t)
    }

    return subscribeInstallPrompt(prompt => {
      setDeferred(prompt)
      if (prompt) setTimeout(() => setShow(true), 2500)
    })
  }, [ios])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShow(false)
  }

  async function install() {
    const outcome = await triggerInstall()
    if (outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, '1')
    setDeferred(null)
    setShow(false)
  }

  if (!show || (!deferred && !ios)) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl w-full max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v13M7 10l5 5 5-5" /><path d="M5 19h14" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-gray-900 dark:text-white text-sm font-semibold">Add to Home Screen</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {ios
                ? 'Install this app for quick access — tap the share button, then "Add to Home Screen".'
                : 'Install Attendance Tracker on your device for quick access, even offline.'}
            </p>
          </div>
        </div>

        {ios && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
              <path d="M12 2v13M7 10l5 5 5-5" /><rect x="3" y="14" width="18" height="7" rx="2" />
            </svg>
            <p className="text-gray-600 dark:text-gray-300 text-xs">
              Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {!ios && (
            <button onClick={install} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className={`${ios ? 'flex-1 bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} text-sm font-semibold py-2.5 rounded-xl transition-colors px-4`}
          >
            {ios ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
