'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

// Animação de entrada suave para widgets
export const WidgetEntrance = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      duration: 0.4, 
      delay,
      ease: [0.25, 0.46, 0.45, 0.94] // Curva de animação suave
    }}
    whileHover={{ 
      y: -2, 
      scale: 1.02,
      transition: { duration: 0.2 }
    }}
    className="h-full"
  >
    {children}
  </motion.div>
)

// Animação de loading com pulso
export const LoadingPulse = ({ className = "" }: { className?: string }) => (
  <motion.div
    className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded ${className}`}
    animate={{
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      backgroundSize: '200% 100%'
    }}
  />
)

// Animação de sucesso com checkmark
export const SuccessAnimation = ({ show, onComplete }: { show: boolean; onComplete?: () => void }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onAnimationComplete={onComplete}
        className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.6, times: [0, 0.6, 1] }}
          className="bg-green-500 text-white rounded-full p-4"
        >
          <motion.svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.svg>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Animação de erro com shake
export const ErrorShake = ({ children, trigger }: { children: ReactNode; trigger: boolean }) => (
  <motion.div
    animate={trigger ? {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    } : {}}
  >
    {children}
  </motion.div>
)

// Animação de contador com efeito de contagem
export const CounterAnimation = ({ 
  value, 
  duration = 1, 
  className = "" 
}: { 
  value: number; 
  duration?: number; 
  className?: string 
}) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString('pt-BR')}
      </motion.span>
    </motion.span>
  )
}

// Animação de progresso circular
export const CircularProgress = ({ 
  progress, 
  size = 40, 
  strokeWidth = 4,
  color = "#3B82F6" 
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string 
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-700">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

// Animação de tooltip com delay
export const TooltipAnimation = ({ 
  children, 
  tooltip, 
  delay = 0.5 
}: { 
  children: ReactNode; 
  tooltip: string; 
  delay?: number 
}) => {
  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {children}
      <motion.div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10"
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </motion.div>
    </motion.div>
  )
}

// Animação de botão com ripple effect
export const RippleButton = ({ 
  children, 
  onClick, 
  className = "",
  disabled = false 
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  className?: string;
  disabled?: boolean 
}) => {
  return (
    <motion.button
      className={`relative overflow-hidden ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-white opacity-0"
          whileTap={{
            opacity: [0, 0.3, 0],
            scale: [0, 1],
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}

// Animação de card flip
export const FlipCard = ({ 
  front, 
  back, 
  isFlipped 
}: { 
  front: ReactNode; 
  back: ReactNode; 
  isFlipped: boolean 
}) => {
  return (
    <div className="relative w-full h-full perspective-1000">
      <motion.div
        className="relative w-full h-full transform-style-preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 backface-hidden">
          {front}
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          {back}
        </div>
      </motion.div>
    </div>
  )
}