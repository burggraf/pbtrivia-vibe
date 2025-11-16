import { useState, useEffect } from 'react'
import GameStart from '@/components/states/GameStart'
import RoundStartDisplay from '@/components/RoundStartDisplay'
import RoundPlayDisplay from '@/components/RoundPlayDisplay'
import RoundEnd from '@/components/states/RoundEnd'
import GameEnd from '@/components/states/GameEnd'
import Thanks from '@/components/states/Thanks'

// Mock data for 8 teams
const mockScoreboard = {
  teams: {
    '1': {
      name: 'Team Alpha',
      players: [
        { id: 'p1', name: 'Alice', email: 'alice@example.com' },
        { id: 'p2', name: 'Bob', email: 'bob@example.com' },
      ],
      score: 500,
      roundScores: { 1: 500 },
    },
    '2': {
      name: 'Team Beta',
      players: [
        { id: 'p3', name: 'Charlie', email: 'charlie@example.com' },
        { id: 'p4', name: 'Diana', email: 'diana@example.com' },
      ],
      score: 450,
      roundScores: { 1: 450 },
    },
    '3': {
      name: 'Team Gamma',
      players: [
        { id: 'p5', name: 'Eve', email: 'eve@example.com' },
        { id: 'p6', name: 'Frank', email: 'frank@example.com' },
      ],
      score: 400,
      roundScores: { 1: 400 },
    },
    '4': {
      name: 'Team Delta',
      players: [
        { id: 'p7', name: 'Grace', email: 'grace@example.com' },
        { id: 'p8', name: 'Henry', email: 'henry@example.com' },
      ],
      score: 350,
      roundScores: { 1: 350 },
    },
    '5': {
      name: 'Team Epsilon',
      players: [
        { id: 'p9', name: 'Iris', email: 'iris@example.com' },
        { id: 'p10', name: 'Jack', email: 'jack@example.com' },
      ],
      score: 300,
      roundScores: { 1: 300 },
    },
    '6': {
      name: 'Team Zeta',
      players: [
        { id: 'p11', name: 'Kate', email: 'kate@example.com' },
        { id: 'p12', name: 'Leo', email: 'leo@example.com' },
      ],
      score: 250,
      roundScores: { 1: 250 },
    },
    '7': {
      name: 'Team Eta',
      players: [
        { id: 'p13', name: 'Mia', email: 'mia@example.com' },
        { id: 'p14', name: 'Noah', email: 'noah@example.com' },
      ],
      score: 200,
      roundScores: { 1: 200 },
    },
    '8': {
      name: 'Team Theta',
      players: [
        { id: 'p15', name: 'Olivia', email: 'olivia@example.com' },
        { id: 'p16', name: 'Peter', email: 'peter@example.com' },
      ],
      score: 150,
      roundScores: { 1: 150 },
    },
  },
}

const testStates = [
  {
    name: 'game-start',
    component: (
      <GameStart
        gameData={{ state: 'game-start' }}
        gameId="test-game"
        gameStatus="in-progress"
        gameCode="TEST123"
        gameName="Test Trivia Game"
      />
    ),
  },
  {
    name: 'round-start',
    component: (
      <RoundStartDisplay
        round={{
          round_number: 1,
          rounds: 3,
          question_count: 10,
          title: 'Science & Technology',
        }}
      />
    ),
  },
  {
    name: 'round-play-question',
    component: (
      <RoundPlayDisplay
        gameData={{
          state: 'round-play',
          round: {
            round_number: 1,
            rounds: 3,
            question_count: 10,
            title: 'Science & Technology',
          },
          question: {
            id: 'q1',
            question_number: 5,
            category: 'Physics',
            question: 'In quantum mechanics, what is the name of the principle stating that it is impossible to simultaneously know both the exact position and exact momentum of a particle with absolute precision?',
            difficulty: 'hard',
            a: 'The Heisenberg Uncertainty Principle, which fundamentally limits measurement precision',
            b: 'The Pauli Exclusion Principle, governing particle spin states',
            c: 'The Schrödinger Wave Equation describing quantum superposition',
            d: 'The Copenhagen Interpretation of quantum measurement collapse',
          },
        }}
        mode="controller"
        gameId="test-game"
        scoreboard={mockScoreboard}
      />
    ),
  },
  {
    name: 'round-play-answer-revealed',
    component: (
      <RoundPlayDisplay
        gameData={{
          state: 'round-play',
          round: {
            round_number: 1,
            rounds: 3,
            question_count: 10,
            title: 'Science & Technology',
          },
          question: {
            id: 'q1',
            question_number: 5,
            category: 'Physics',
            question: 'In quantum mechanics, what is the name of the principle stating that it is impossible to simultaneously know both the exact position and exact momentum of a particle with absolute precision?',
            difficulty: 'hard',
            a: 'The Heisenberg Uncertainty Principle, which fundamentally limits measurement precision',
            b: 'The Pauli Exclusion Principle, governing particle spin states',
            c: 'The Schrödinger Wave Equation describing quantum superposition',
            d: 'The Copenhagen Interpretation of quantum measurement collapse',
            correct_answer: 'A',
          },
        }}
        mode="controller"
        gameId="test-game"
        scoreboard={mockScoreboard}
      />
    ),
  },
  {
    name: 'round-end',
    component: (
      <RoundEnd
        gameData={{
          state: 'round-end',
          round: {
            round_number: 1,
            rounds: 3,
            question_count: 10,
            title: 'Science & Technology',
          },
        }}
        scoreboard={mockScoreboard}
      />
    ),
  },
  {
    name: 'game-end',
    component: (
      <GameEnd
        gameData={{
          state: 'game-end',
        }}
        scoreboard={mockScoreboard}
      />
    ),
  },
  {
    name: 'thanks',
    component: <Thanks />,
  },
]

interface TestModeProps {
  onComplete: () => void
}

export function TestMode({ onComplete }: TestModeProps) {
  const [currentStateIndex, setCurrentStateIndex] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStateIndex < testStates.length - 1) {
        setCurrentStateIndex(currentStateIndex + 1)
      } else {
        onComplete()
      }
    }, 3000) // 3 seconds per state

    return () => clearTimeout(timer)
  }, [currentStateIndex, onComplete])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      {testStates[currentStateIndex].component}
    </div>
  )
}
