import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArtworkCard } from './ArtworkCard'
import { useVoting } from '../hooks/useVoting'
import { getEntryAnimation, getExitAnimation } from '../utils/animationUtils'

const dummyArtworks = [
  { id: '1', imageUrl: '/placeholder.svg?height=600&width=400&text=Artwork 1', title: 'Artwork 1' },
  { id: '2', imageUrl: '/placeholder.svg?height=600&width=400&text=Artwork 2', title: 'Artwork 2' },
  { id: '3', imageUrl: '/placeholder.svg?height=600&width=400&text=Artwork 3', title: 'Artwork 3' },
  { id: '4', imageUrl: '/placeholder.svg?height=600&width=400&text=Artwork 4', title: 'Artwork 4' },
  { id: '5', imageUrl: '/placeholder.svg?height=600&width=400&text=Artwork 5', title: 'Artwork 5' },
  { id: '6', imageUrl: '/placeholder.svg?height=600&width=400&text=Artwork 6', title: 'Artwork 6' },
]

export const ArtworkPairVoting: React.FC = () => {
  const [artworks, setArtworks] = useState(dummyArtworks)
  const [currentPair, setCurrentPair] = useState(artworks.slice(0, 2))
  const [isFlying, setIsFlying] = useState(false)
  const [entryAnimations, setEntryAnimations] = useState([
    getEntryAnimation('left'),
    getEntryAnimation('right')
  ])
  const [exitAnimations, setExitAnimations] = useState([
    getExitAnimation('left'),
    getExitAnimation('right')
  ])

  const handleVote = (selectedId: string) => {
    setIsFlying(true)
    setTimeout(() => {
      setArtworks((prev) => {
        const newArtworks = [...prev]
        newArtworks.splice(0, 2)
        return newArtworks
      })
      setIsFlying(false)
      setEntryAnimations([getEntryAnimation('left'), getEntryAnimation('right')])
      setExitAnimations([getExitAnimation('left'), getExitAnimation('right')])
    }, 1500) // Increased delay to allow for the nod animation
  }

  const {
    selectedId,
    hoveredId,
    feedback,
    scaleLeft,
    scaleRight,
    rotateYLeft,
    rotateYRight,
    handleSelect,
    handleHover,
  } = useVoting(handleVote)

  useEffect(() => {
    setCurrentPair(artworks.slice(0, 2))
  }, [artworks])

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
      <div className="relative w-full max-w-5xl h-[80vh] flex justify-center items-center">
        <AnimatePresence mode="wait">
          {currentPair.map((artwork, index) => (
            <motion.div
              key={artwork.id}
              className="absolute w-2/5 h-full"
              style={{
                left: index === 0 ? '5%' : '55%',
              }}
            >
              <ArtworkCard
                artwork={artwork}
                position={index === 0 ? 'left' : 'right'}
                scale={index === 0 ? scaleLeft : scaleRight}
                rotateY={index === 0 ? rotateYLeft : rotateYRight}
                onSelect={() => handleSelect(index === 0 ? 'left' : 'right')}
                onHover={(isHovered) => handleHover(isHovered ? (index === 0 ? 'left' : 'right') : null)}
                isSelected={selectedId === (index === 0 ? 'left' : 'right')}
                isHovered={hoveredId === (index === 0 ? 'left' : 'right')}
                isFlying={isFlying}
                flyAnimation={isFlying ? exitAnimations[index] : entryAnimations[index]}
                exitDelay={selectedId === (index === 0 ? 'left' : 'right') ? 0.5 : 0}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {feedback && (
          <motion.div
            className="absolute top-4 left-0 right-0 text-center text-white text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {feedback}
          </motion.div>
        )}
      </div>
    </div>
  )
}

