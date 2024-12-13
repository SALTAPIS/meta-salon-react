import { useState } from 'react'
import { useSpring } from 'framer-motion'

const feedbackMessages = [
  "Wow, you actually have taste. Surprising.",
  "Not the worst choice I've seen today.",
  "Interesting... if you're into that sort of thing.",
  "Bold choice. I guess someone had to pick it.",
  "Well, at least you're consistent in your questionable taste.",
]

export const useVoting = (onVote: (selectedId: string) => void) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const scaleLeft = useSpring(1, { stiffness: 300, damping: 25 })
  const scaleRight = useSpring(1, { stiffness: 300, damping: 25 })
  const rotateYLeft = useSpring(0, { stiffness: 300, damping: 25 })
  const rotateYRight = useSpring(0, { stiffness: 300, damping: 25 })

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]
    setFeedback(randomFeedback)
    if (id === 'left') {
      scaleLeft.set(1.3)
      scaleRight.set(0.7)
      rotateYLeft.set(0)
      rotateYRight.set(30)
    } else {
      scaleLeft.set(0.7)
      scaleRight.set(1.3)
      rotateYLeft.set(-30)
      rotateYRight.set(0)
    }
    setTimeout(() => {
      onVote(id)
      scaleLeft.set(1)
      scaleRight.set(1)
      rotateYLeft.set(0)
      rotateYRight.set(0)
      setSelectedId(null)
      setFeedback(null)
    }, 1500)
  }

  const handleHover = (id: string | null) => {
    setHoveredId(id)
    if (id === 'left') {
      scaleLeft.set(1.2)
      scaleRight.set(0.8)
      rotateYLeft.set(-15)
      rotateYRight.set(30)
    } else if (id === 'right') {
      scaleLeft.set(0.8)
      scaleRight.set(1.2)
      rotateYLeft.set(30)
      rotateYRight.set(-15)
    } else {
      scaleLeft.set(1)
      scaleRight.set(1)
      rotateYLeft.set(0)
      rotateYRight.set(0)
    }
  }

  return {
    selectedId,
    hoveredId,
    feedback,
    scaleLeft,
    scaleRight,
    rotateYLeft,
    rotateYRight,
    handleSelect,
    handleHover,
  }
}

