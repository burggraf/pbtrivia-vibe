import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase'
import type { DisplaysRecord } from '@/types/pocketbase-types'
import { Loader2 } from 'lucide-react'

interface DisplayManagementProps {
  gameId: string
}

export default function DisplayManagement({ gameId }: DisplayManagementProps) {
  const [code, setCode] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [displays, setDisplays] = useState<DisplaysRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Load claimed displays
  useEffect(() => {
    const loadDisplays = async () => {
      try {
        const userId = pb.authStore.model?.id
        if (!userId) return

        const records = await pb.collection('displays').getFullList<DisplaysRecord>({
          filter: `host = "${userId}" && game = "${gameId}"`,
        })
        setDisplays(records)
      } catch (err) {
        console.error('Failed to load displays:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDisplays()

    // Subscribe to display changes
    const userId = pb.authStore.model?.id
    if (!userId) return

    pb.collection('displays').subscribe<DisplaysRecord>('*', (e) => {
      if (e.record.host === userId && e.record.game === gameId) {
        // Display was claimed by this host for this game
        setDisplays((prev) => {
          const exists = prev.find((d) => d.id === e.record.id)
          if (exists) {
            return prev.map((d) => (d.id === e.record.id ? e.record : d))
          }
          return [...prev, e.record]
        })
      } else if (e.record.game !== gameId) {
        // Display was released or assigned to different game
        setDisplays((prev) => prev.filter((d) => d.id !== e.record.id))
      }
    })

    return () => {
      pb.collection('displays').unsubscribe('*')
    }
  }, [gameId])

  const handleClaim = async () => {
    if (!code.trim() || code.length !== 6) {
      alert('Please enter a valid 6-digit code')
      return
    }

    setClaiming(true)
    try {
      const userId = pb.authStore.model?.id
      if (!userId) {
        alert('Not authenticated')
        return
      }

      // Query for display with this code
      const records = await pb.collection('displays').getFullList<DisplaysRecord>({
        filter: `code = "${code}" && available = true`,
      })

      if (records.length === 0) {
        alert('Display not found or already claimed')
        setCode('')
        return
      }

      // Claim the display
      await pb.collection('displays').update<DisplaysRecord>(records[0].id, {
        host: userId,
        game: gameId,
        available: false,
      })

      alert('Display claimed successfully')
      setCode('')
    } catch (err) {
      console.error('Failed to claim display:', err)
      alert('Failed to claim display. It may already be claimed.')
      setCode('')
    } finally {
      setClaiming(false)
    }
  }

  const handleRelease = async (displayId: string) => {
    try {
      await pb.collection('displays').update<DisplaysRecord>(displayId, {
        host: null,
        game: null,
        available: true,
      })
      alert('Display released')
    } catch (err) {
      console.error('Failed to release display:', err)
      alert('Failed to release display')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Claim Display Section */}
      <div className="space-y-2">
        <label htmlFor="display-code" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Claim Display
        </label>
        <div className="flex gap-2">
          <Input
            id="display-code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="flex-1"
          />
          <Button onClick={handleClaim} disabled={claiming || code.length !== 6}>
            {claiming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              'Claim Display'
            )}
          </Button>
        </div>
      </div>

      {/* Claimed Displays List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Claimed Displays ({displays.length})
        </h3>

        {displays.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center border border-slate-200 dark:border-slate-700 rounded-md">
            No displays claimed. Enter a code above to claim a display.
          </p>
        ) : (
          <div className="space-y-2">
            {displays.map((display) => (
              <div
                key={display.id}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${display.available ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="text-sm font-medium">
                      {display.available ? 'Disconnected' : 'Connected'}
                    </span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Code: {display.code}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRelease(display.id)}
                >
                  Release
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
