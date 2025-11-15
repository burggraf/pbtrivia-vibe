import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'

interface QrCodeCardProps {
  gameCode: string
  joinUrl: string
  showJoinLink: boolean
}

export default function QrCodeCard({ gameCode, joinUrl, showJoinLink }: QrCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link')
    }
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg aspect-square flex flex-col">
      <CardContent className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="bg-white p-3 md:p-4 rounded-lg mb-3 md:mb-4">
          <QRCode value={joinUrl} size={128} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
            Game Code: {gameCode}
          </p>
          {showJoinLink && (
            <button
              onClick={handleCopyLink}
              className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {copied ? 'Copied!' : 'Click to copy link'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
