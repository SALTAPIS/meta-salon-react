import { motion } from 'framer-motion'
import { getNodAnimation } from '../utils/animationUtils'

interface ArtworkCardProps {
  artwork: {
    id: string
    imageUrl: string
    title: string
  }
  position: 'left' | 'right'
  scale: any
  rotateY: any
  onSelect: () => void
  onHover: (isHovered: boolean) => void
  isSelected: boolean
  isHovered: boolean
  isFlying: boolean
  flyAnimation: { x: number; y: number; rotate: number }
  exitDelay: number
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  position,
  scale,
  rotateY,
  onSelect,
  onHover,
  isSelected,
  isHovered,
  isFlying,
  flyAnimation,
  exitDelay,
}) => {
  return (
    <motion.div
      className={`w-full h-full cursor-pointer ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        scale,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        transformOrigin: position === 'left' ? 'right center' : 'left center',
      }}
      initial={flyAnimation}
      animate={isFlying ? (isSelected ? getNodAnimation() : flyAnimation) : {
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
      }}
      exit={{
        ...flyAnimation,
        transition: { delay: exitDelay, duration: 0.5 }
      }}
      transition={{ type: 'spring', stiffness: 50, damping: 10 }}
      onClick={onSelect}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
    >
      <motion.div
        className="w-full h-full rounded-2xl overflow-hidden shadow-lg"
        style={{
          rotateY: isHovered ? 0 : (position === 'left' ? 5 : -5),
          transition: 'rotate 0.3s ease-out',
        }}
      >
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <h2 className="text-white text-xl font-bold">{artwork.title}</h2>
        </div>
      </motion.div>
      {isSelected && (
        <motion.div
          className="absolute top-4 left-4 right-4 text-center text-white text-2xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          Selected!
        </motion.div>
      )}
    </motion.div>
  )
}

