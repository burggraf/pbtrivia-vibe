import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getFileUrl } from '@/lib/pocketbase'
import PlayerDetailsModal from './PlayerDetailsModal'

interface Player {
  id: string
  gamePlayerId?: string
  name: string
  avatar: string
}

interface TeamCardProps {
  teamId: string
  teamName: string
  players: Player[]
  score?: number
}

export default function TeamCard({ teamId, teamName, players, score }: TeamCardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player)
    setModalOpen(true)
  }
  return (
    <Card key={teamId} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg aspect-square flex flex-col">
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">
            {teamName}
          </CardTitle>
          {score !== undefined && (
            <Badge variant="secondary" className="ml-2">
              {score} pts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pt-0">
        <div className="space-y-1.5 md:space-y-2">
          {players.map((player) => {
            const avatarUrl = player.avatar && player.id
              ? getFileUrl('_pb_users_auth_', player.id, player.avatar, { thumb: '100x100' })
              : ''

            return (
              <div
                key={player.id}
                onClick={() => handlePlayerClick(player)}
                className="flex items-center gap-2 p-1.5 md:p-2 rounded bg-slate-50 dark:bg-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${player.name}'s avatar`}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-100">
                    {player.name}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {selectedPlayer && (
        <PlayerDetailsModal
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          playerAvatar={selectedPlayer.avatar}
          teamName={teamName}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </Card>
  )
}
