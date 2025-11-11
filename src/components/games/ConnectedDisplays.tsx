import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase'
import type { DisplaysRecord } from '@/types/pocketbase-types'
import type { Game } from '@/types/games'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'

interface DisplayWithGame extends DisplaysRecord {
  expand?: {
    game?: Game
  }
}

export default function ConnectedDisplays() {
  const navigate = useNavigate()
  const [displays, setDisplays] = useState<DisplayWithGame[]>([])
  const [loading, setLoading] = useState(true)

  // Load claimed displays for this host
  useEffect(() => {
    const loadDisplays = async () => {
      try {
        const userId = pb.authStore.model?.id
        if (!userId) return

        const records = await pb.collection('displays').getFullList<DisplayWithGame>({
          filter: `host = "${userId}" && game != null`,
          expand: 'game',
          sort: '-updated',
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

    pb.collection('displays').subscribe<DisplayWithGame>('*', async (e) => {
      // Only care about displays owned by this host
      if (e.record.host !== userId) {
        // Check if this was previously our display and now released
        setDisplays((prev) => prev.filter((d) => d.id !== e.record.id))
        return
      }

      // Fetch expanded record for updates
      try {
        const expandedRecord = await pb.collection('displays').getOne<DisplayWithGame>(e.record.id, {
          expand: 'game',
        })

        setDisplays((prev) => {
          // If game is null, remove from list
          if (!expandedRecord.game) {
            return prev.filter((d) => d.id !== expandedRecord.id)
          }

          const exists = prev.find((d) => d.id === expandedRecord.id)
          if (exists) {
            // Update existing
            return prev.map((d) => (d.id === expandedRecord.id ? expandedRecord : d))
          }
          // Add new
          return [...prev, expandedRecord]
        })
      } catch (err) {
        console.error('Failed to fetch expanded display:', err)
      }
    })

    return () => {
      pb.collection('displays').unsubscribe('*')
    }
  }, [])

  const handleRelease = async (displayId: string) => {
    try {
      await pb.collection('displays').update<DisplaysRecord>(displayId, {
        host: null,
        game: null,
        available: true,
      })
      toast.success('Display released')
    } catch (err) {
      console.error('Failed to release display:', err)
      toast.error('Failed to release display')
    }
  }

  const handlePlayGame = (gameId: string) => {
    navigate(`/controller/${gameId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (displays.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          No connected displays. Claim a display from the game controller to connect it.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {displays.map((display) => (
        <div
          key={display.id}
          className="flex items-center justify-between p-4 border border-[#e5e5e5] dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 hover:bg-[#fafafa] dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${display.available ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-[13px] font-medium text-[#0a0a0a] dark:text-white">
                Display {display.code}
              </span>
            </div>
            {display.expand?.game && (
              <span className="text-[13px] text-slate-600 dark:text-slate-400">
                {display.expand.game.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {display.game && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePlayGame(display.game!)}
                className="h-8 px-3 text-[13px] font-medium bg-[#0a0a0a] dark:bg-white text-white dark:text-slate-900 hover:bg-[#262626] dark:hover:bg-slate-200 flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5" />
                Play
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRelease(display.id)}
              className="h-8 px-3 text-[13px]"
            >
              Release
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
