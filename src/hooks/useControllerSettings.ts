import { useState, useEffect } from 'react'

interface ControllerSettings {
  showQrCode: boolean
  showJoinLink: boolean
}

const STORAGE_KEY_QR = 'controller.showQrCode'
const STORAGE_KEY_LINK = 'controller.showJoinLink'

export function useControllerSettings() {
  const [showQrCode, setShowQrCode] = useState(true)
  const [showJoinLink, setShowJoinLink] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const qrSetting = localStorage.getItem(STORAGE_KEY_QR)
    const linkSetting = localStorage.getItem(STORAGE_KEY_LINK)

    if (qrSetting !== null) {
      setShowQrCode(qrSetting === 'true')
    }
    if (linkSetting !== null) {
      setShowJoinLink(linkSetting === 'true')
    }
  }, [])

  const toggleQrCode = () => {
    const newValue = !showQrCode
    setShowQrCode(newValue)
    localStorage.setItem(STORAGE_KEY_QR, String(newValue))
  }

  const toggleJoinLink = () => {
    const newValue = !showJoinLink
    setShowJoinLink(newValue)
    localStorage.setItem(STORAGE_KEY_LINK, String(newValue))
  }

  return {
    showQrCode,
    showJoinLink,
    toggleQrCode,
    toggleJoinLink
  }
}
