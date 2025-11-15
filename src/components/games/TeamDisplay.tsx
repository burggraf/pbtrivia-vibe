import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameScoreboard, ScoreboardPlayer } from '@/types/games'
import pb, { getFileUrl } from '@/lib/pocketbase'
import PlayerDetailsModal from './PlayerDetailsModal'
import TeamDetailsModal from './TeamDetailsModal'

interface TeamDisplayProps {
  scoreboard?: GameScoreboard
  isLoading?: boolean
  className?: string
}

interface SelectedTeam {
  id: string
  name: string
  players: ScoreboardPlayer[]
}

export default function TeamDisplay({ scoreboard, isLoading = false, className = "" }: TeamDisplayProps) {
  const currentUserId = pb.authStore.model?.id
  const [selectedPlayer, setSelectedPlayer] = useState<ScoreboardPlayer & { teamName: string } | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam | null>(null)
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)

  const handlePlayerClick = (player: ScoreboardPlayer, teamName: string) => {
    setSelectedPlayer({ ...player, teamName })
    setPlayerModalOpen(true)
  }

  const handleTeamNameClick = (teamId: string, teamName: string, players: ScoreboardPlayer[]) => {
    setSelectedTeam({ id: teamId, name: teamName, players })
    setTeamModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 md:py-12 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Loading team data...</p>
      </div>
    )
  }

  if (!scoreboard || Object.keys(scoreboard.teams).length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            No teams have been created yet. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  // Filter teams to only include those with players
  const teamsWithPlayers = Object.entries(scoreboard.teams).filter(([_, teamData]) => teamData.players.length > 0)

  if (teamsWithPlayers.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            No players have joined teams yet. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 ${className}`}>
      {teamsWithPlayers.map(([teamId, teamData]) => (
        <Card key={teamId} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle
              onClick={() => handleTeamNameClick(teamId, teamData.name, teamData.players)}
              className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {teamData.name}
            </CardTitle>
            <CardDescription>
              {teamData.players.length === 1 ? '1 player' : `${teamData.players.length} players`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5 md:space-y-2">
              {teamData.players.map((player) => {
                const isCurrentUser = player.id === currentUserId
                const avatarUrl = player.avatar && player.id
                  ? getFileUrl('_pb_users_auth_', player.id, player.avatar, { thumb: '100x100' })
                  : ''

                return (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerClick(player, teamData.name)}
                    className={`flex items-center gap-2 p-1.5 md:p-2 rounded cursor-pointer transition-colors ${
                      isCurrentUser
                        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 dark:ring-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${player.name}'s avatar`}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isCurrentUser ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrentUser
                          ? 'text-blue-900 dark:text-blue-100 font-semibold'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {player.name} {isCurrentUser && '(You)'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedPlayer && (
        <PlayerDetailsModal
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          playerAvatar={selectedPlayer.avatar}
          teamName={selectedPlayer.teamName}
          open={playerModalOpen}
          onOpenChange={setPlayerModalOpen}
        />
      )}

      {selectedTeam && (
        <TeamDetailsModal
          teamName={selectedTeam.name}
          players={selectedTeam.players}
          open={teamModalOpen}
          onOpenChange={setTeamModalOpen}
        />
      )}
    </div>
  )
}