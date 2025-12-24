import { useState } from 'react'
import { ArrowRight, Sprout } from 'lucide-react'

interface SplashScreenProps {
  onEnter: () => void
}

export function SplashScreen({ onEnter }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleEnter = () => {
    setIsExiting(true)
    setTimeout(onEnter, 500)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(45deg, #ec4899, #a855f7, #8b5cf6, #06b6d4, #a855f7, #ec4899)',
          backgroundSize: '400% 400%',
          animation: 'splash-gradient 15s ease infinite',
        }}
      />

      {/* Glass Card */}
      <div className="relative z-10 w-full h-[90vh] max-w-[95vw] mx-auto p-6 md:p-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl w-full h-full p-8 md:p-12 flex flex-col">

          {/* Top Bar */}
          <div className="flex items-center justify-end mb-auto">
            <span className="text-white font-semibold text-lg">Intel MMET-Gaming & AI</span>
          </div>

          {/* Bottom Content */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Left - Logo + Title + Tagline */}
            <div>
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mb-6 animate-slide-in-left opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <Sprout className="w-16 h-16 md:w-20 md:h-20 text-white" />
              </div>
              <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-black tracking-tighter leading-[0.85] text-white animate-slide-in-left opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                Model
              </h1>
              <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-black tracking-tighter leading-[0.85] text-white animate-slide-in-left opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                Garden.<span className="text-white/50 text-lg md:text-xl lg:text-2xl font-medium tracking-wide ml-4 align-baseline">Your local AI Playground</span>
              </h1>
            </div>

            {/* Right - Button */}
            <div className="lg:self-end animate-slide-in-right opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <button
                onClick={handleEnter}
                className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-full font-semibold text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white transition-opacity duration-300 group-hover:opacity-0" />
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-flow"
                  style={{
                    background: 'linear-gradient(90deg, #ec4899 0%, #d946ef 15%, #a855f7 25%, #8b5cf6 40%, #06b6d4 55%, #8b5cf6 70%, #a855f7 80%, #ef4444 90%, #ec4899 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <span className="relative z-10 text-gray-900 group-hover:text-white transition-colors duration-300">
                  Start Exploring
                </span>
                <span className="relative z-10 w-10 h-10 rounded-full bg-gray-900 group-hover:bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-white" />
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
