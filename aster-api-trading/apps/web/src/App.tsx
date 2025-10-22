import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import BrainViewer from './pages/BrainViewer'
import DecisionLog from './pages/DecisionLog'
import Trading from './pages/Trading'
import { RiRobot2Fill, RiBrainFill } from 'react-icons/ri'
import { HiChartBar, HiDocumentText, HiCurrencyDollar } from 'react-icons/hi'

type Page = 'dashboard' | 'brain' | 'decisions' | 'trading'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'brain':
        return <BrainViewer />
      case 'decisions':
        return <DecisionLog />
      case 'trading':
        return <Trading />
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-card border-b border-dark-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-dark rounded-lg flex items-center justify-center">
                <RiRobot2Fill className="text-dark-bg text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gold tracking-tight">GCR AI</h1>
                <p className="text-xs text-gray-400">AI-Powered Trading Agent</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-10 backdrop-blur-sm bg-dark-card/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                currentPage === 'dashboard'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-400 hover:text-gold-light hover:border-dark-border'
              }`}
            >
              <HiChartBar className="text-lg" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('brain')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                currentPage === 'brain'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-400 hover:text-gold-light hover:border-dark-border'
              }`}
            >
              <RiBrainFill className="text-lg" />
              Brain Viewer
            </button>
            <button
              onClick={() => setCurrentPage('decisions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                currentPage === 'decisions'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-400 hover:text-gold-light hover:border-dark-border'
              }`}
            >
              <HiDocumentText className="text-lg" />
              Decisions
            </button>
            <button
              onClick={() => setCurrentPage('trading')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                currentPage === 'trading'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-400 hover:text-gold-light hover:border-dark-border'
              }`}
            >
              <HiCurrencyDollar className="text-lg" />
              Trading
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
