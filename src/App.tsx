import { useEffect, useState } from 'react'
import { HistorySidebar } from '@/components/HistorySidebar'
import { ChatView } from '@/components/ChatView'
import { SettingsSidebar } from '@/components/SettingsSidebar'
import { SplashScreen } from '@/components/SplashScreen'
import { ToastProvider } from '@/components/ui/toast'
import { useChatStore } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { useSettingsStore } from '@/stores/settingsStore'

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash on first visit of session
    return !sessionStorage.getItem('splashShown')
  })

  const loadChats = useChatStore((s) => s.loadChats)
  const loadModels = useModelStore((s) => s.loadModels)
  const theme = useSettingsStore((s) => s.theme)

  const handleEnterApp = () => {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  // Initialize app
  useEffect(() => {
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', theme)

    // Load data
    loadChats()
    loadModels()
  }, [loadChats, loadModels, theme])

  if (showSplash) {
    return <SplashScreen onEnter={handleEnterApp} />
  }

  return (
    <ToastProvider>
      <div className="fixed inset-0 overflow-hidden bg-gradient-animated">
        <div className="relative z-10 h-full flex">
          <HistorySidebar />
          <ChatView />
          <SettingsSidebar />
        </div>
      </div>
    </ToastProvider>
  )
}

export default App
