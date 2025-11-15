import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import { Users, Zap, Settings, Sparkles, Play, Trophy } from 'lucide-react'
import packageJson from '../../package.json'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              Azabab Trivia Party v.{packageJson.version}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100">
              Trivia Party
            </h2>
            <p className="text-lg sm:text-xl italic text-slate-600 dark:text-slate-400">
              Let's have fun — together!
            </p>
          </div>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            The ultimate trivia experience that brings people together. Whether you're hosting a game night or joining friends, Trivia Party makes every moment unforgettable.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/login?role=player')}
              className="min-h-14 px-8 text-lg bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              <Play className="mr-2 h-5 w-5" />
              I'm a Player
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/login?role=host')}
              className="min-h-14 px-8 text-lg bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              <Trophy className="mr-2 h-5 w-5" />
              I Want to Host
            </Button>
          </div>
        </div>
      </section>

      {/* Two-Column Feature Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Player Experience */}
          <Card className="p-6 sm:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Users className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                For Players
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Simple, easy, and delightful. Just join and play.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Quick Join:</strong> Enter a game code and you're in
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Team Play:</strong> Collaborate with friends or compete solo
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Real-time Updates:</strong> See results and scores instantly
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">No Setup:</strong> Zero configuration, just fun
                </span>
              </li>
            </ul>
          </Card>

          {/* Host Experience */}
          <Card className="p-6 sm:p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Settings className="h-6 w-6 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                For Hosts
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Powerful, flexible, and surprisingly simple. Create memorable experiences effortlessly.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Quick Setup:</strong> Create a game in under 60 seconds
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">60K+ Questions:</strong> Massive database across all categories
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Full Control:</strong> Customize rounds, teams, and timers
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Display Screen:</strong> Share progress on any projector or TV
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="font-semibold">Live Management:</strong> Track scores and moderate in real-time
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-12 sm:py-16 bg-slate-100 dark:bg-slate-800/50 -mx-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Everything You Need for an Amazing Trivia Night
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                Real-time Collaboration
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Instant updates keep everyone in sync as the game progresses
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                Multiple Game Modes
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Play solo or in teams with flexible round structures
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                Mobile Friendly
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Works seamlessly on phones, tablets, and desktops
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                Custom Categories
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Choose from dozens of trivia categories and difficulty levels
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                Shared Display
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Native display app for projectors, TVs, and large screens
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                Dark Mode Support
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Beautiful interface in both light and dark themes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            Ready to Get Started?
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Join a game or host your own trivia night in seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/login?role=player')}
              className="min-h-14 px-8 text-lg bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              <Play className="mr-2 h-5 w-5" />
              Join as Player
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/login?role=host')}
              className="min-h-14 px-8 text-lg bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Start Hosting
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Azabab. Trivia Party.</p>
        </div>
      </footer>
    </div>
  )
}
