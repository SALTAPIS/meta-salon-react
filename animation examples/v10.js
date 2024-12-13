import { preloadImages } from './utils.js';
import gsap from 'gsap';

class SlidingPostcards {
    constructor() {
        this.config = {
            postcard: {
                width: 350,
                height: 250
            },
            physics: {
                friction: 0.98,
                rotationDamping: 0.95,
                minSpeed: 0.1,
                throwForce: 20,
                collisionElasticity: 0.7,
                initialSpread: 300,
                maxRotation: 4,
                throwRadius: 1500
            },
            maxPostcards: 100,
            throwInterval: 2000,
            minZoom: 0.2,
            zoomMargin: 150,
            throwPositions: [
                { angle: 0, label: 'right' },
                { angle: Math.PI / 2, label: 'bottom' },
                { angle: Math.PI, label: 'left' },
                { angle: -Math.PI / 2, label: 'top' }
            ]
        };

        this.state = {
            postcards: [],
            bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
            currentZoom: 1,
            lastFrameTime: 0,
            isDraggingScene: false,
            dragStart: { x: 0, y: 0 },
            sceneOffset: { x: 0, y: 0 },
            lastThrowPosition: -1
        };

        this.init();
    }

    init() {
        this.container = document.querySelector('.gallery');
        this.galleryContainer = document.querySelector('.gallery-container');
        
        // Initialize scene dragging
        this.galleryContainer.addEventListener('mousedown', this.startSceneDrag.bind(this));
        document.addEventListener('mousemove', this.dragScene.bind(this));
        document.addEventListener('mouseup', this.endSceneDrag.bind(this));

        // Start throwing cards
        this.throwCard();
        this.throwInterval = setInterval(() => this.throwCard(), this.config.throwInterval);

        requestAnimationFrame(this.animate.bind(this));
    }

    startSceneDrag(e) {
        if (e.target === this.galleryContainer) {
            this.state.isDraggingScene = true;
            this.state.dragStart = {
                x: e.clientX - this.state.sceneOffset.x,
                y: e.clientY - this.state.sceneOffset.y
            };
            this.galleryContainer.style.cursor = 'grabbing';
        }
    }

    dragScene(e) {
        if (!this.state.isDraggingScene) return;

        this.state.sceneOffset = {
            x: e.clientX - this.state.dragStart.x,
            y: e.clientY - this.state.dragStart.y
        };

        this.updateScenePosition();
    }

    endSceneDrag() {
        this.state.isDraggingScene = false;
        this.galleryContainer.style.cursor = 'grab';
    }

    updateScenePosition() {
        const matrix = new DOMMatrix(window.getComputedStyle(this.container).transform);
        const scale = matrix.a;  // Current scale value

        gsap.set(this.container, {
            x: this.state.sceneOffset.x,
            y: this.state.sceneOffset.y,
            scale: scale || 1
        });
    }

    getNextThrowPosition() {
        // Cycle through throw positions
        this.state.lastThrowPosition = (this.state.lastThrowPosition + 1) % this.config.throwPositions.length;
        const basePosition = this.config.throwPositions[this.state.lastThrowPosition];
        
        // Add some randomness to the angle
        const randomAngle = basePosition.angle + (Math.random() - 0.5) * Math.PI / 4;
        
        return {
            x: Math.cos(randomAngle) * this.config.physics.throwRadius,
            y: Math.sin(randomAngle) * this.config.physics.throwRadius,
            angle: randomAngle
        };
    }

    throwCard() {
        if (this.state.postcards.length >= this.config.maxPostcards) {
            clearInterval(this.throwInterval);
            return;
        }

        // Get throw position and calculate velocity towards center
        const throwPos = this.getNextThrowPosition();
        const throwForce = this.config.physics.throwForce * (0.8 + Math.random() * 0.4);
        
        // Calculate velocity towards a random point near center
        const targetOffset = {
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400
        };

        const dx = targetOffset.x - throwPos.x;
        const dy = targetOffset.y - throwPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const velocity = {
            x: (dx / distance) * throwForce,
            y: (dy / distance) * throwForce
        };

        // Initial rotation within limits
        const rotation = (Math.random() * 2 - 1) * this.config.physics.maxRotation;
        const angularVelocity = (Math.random() - 0.5) * 5;

        this.createPostcard(throwPos.x, throwPos.y, velocity, rotation, angularVelocity);
    }

    createPostcard(x, y, velocity, rotation, angularVelocity) {
        const postcard = document.createElement('div');
        postcard.className = 'postcard';

        const img = document.createElement('div');
        img.className = 'postcard__img';

        const artworkIndex = Math.floor(Math.random() * 143) + 1;
        img.style.backgroundImage = `url(/img/artworks/artwork${artworkIndex}.jpeg)`;

        postcard.appendChild(img);
        this.container.appendChild(postcard);

        const newCard = {
            element: postcard,
            x: x - this.config.postcard.width / 2,
            y: y - this.config.postcard.height / 2,
            velocity: velocity,
            rotation: rotation,
            angularVelocity: angularVelocity,
            width: this.config.postcard.width,
            height: this.config.postcard.height
        };

        this.state.postcards.push(newCard);
        return newCard;
    }

    updateBounds() {
        if (this.state.postcards.length === 0) return;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.state.postcards.forEach(card => {
            minX = Math.min(minX, card.x);
            maxX = Math.max(maxX, card.x + card.width);
            minY = Math.min(minY, card.y);
            maxY = Math.max(maxY, card.y + card.height);
        });

        this.state.bounds = { minX, maxX, minY, maxY };

        const margin = this.config.zoomMargin;
        const boundsWidth = maxX - minX + margin * 2;
        const boundsHeight = maxY - minY + margin * 2;
        const windowRatio = window.innerWidth / window.innerHeight;
        const boundsRatio = boundsWidth / boundsHeight;

        let zoom = 1;
        if (boundsRatio > windowRatio) {
            zoom = window.innerWidth / boundsWidth;
        } else {
            zoom = window.innerHeight / boundsHeight;
        }

        zoom = Math.max(zoom, this.config.minZoom);
        this.state.currentZoom = zoom;

        gsap.to(this.container, {
            duration: 1,
            scale: zoom,
            ease: 'power2.out'
        });
    }

    checkCollision(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x || 
                rect1.x > rect2.x + rect2.width || 
                rect1.y + rect1.height < rect2.y || 
                rect1.y > rect2.y + rect2.height);
    }

    resolveCollision(card1, card2) {
        const center1 = {
            x: card1.x + card1.width / 2,
            y: card1.y + card1.height / 2
        };
        const center2 = {
            x: card2.x + card2.width / 2,
            y: card2.y + card2.height / 2
        };

        const dx = center2.x - center1.x;
        const dy = center2.y - center1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / distance;
        const ny = dy / distance;

        const relativeVelocityX = card1.velocity.x - card2.velocity.x;
        const relativeVelocityY = card1.velocity.y - card2.velocity.y;
        const impulse = (relativeVelocityX * nx + relativeVelocityY * ny) * this.config.physics.collisionElasticity;

        card1.velocity.x -= impulse * nx;
        card1.velocity.y -= impulse * ny;
        card2.velocity.x += impulse * nx;
        card2.velocity.y += impulse * ny;

        const impactSpeed = Math.sqrt(relativeVelocityX * relativeVelocityX + relativeVelocityY * relativeVelocityY);
        card1.angularVelocity += (Math.random() - 0.5) * impactSpeed * 0.1;
        card2.angularVelocity += (Math.random() - 0.5) * impactSpeed * 0.1;

        const overlap = 5;
        card1.x -= nx * overlap;
        card1.y -= ny * overlap;
        card2.x += nx * overlap;
        card2.y += ny * overlap;
    }

    animate(timestamp) {
        const deltaTime = timestamp - (this.state.lastFrameTime || timestamp);
        this.state.lastFrameTime = timestamp;

        this.state.postcards.forEach(postcard => {
            postcard.x += postcard.velocity.x * (deltaTime / 16);
            postcard.y += postcard.velocity.y * (deltaTime / 16);
            postcard.rotation += postcard.angularVelocity;

            if (Math.abs(postcard.rotation) > this.config.physics.maxRotation) {
                postcard.rotation = Math.sign(postcard.rotation) * this.config.physics.maxRotation;
                postcard.angularVelocity *= -0.5;
            }

            postcard.velocity.x *= this.config.physics.friction;
            postcard.velocity.y *= this.config.physics.friction;
            postcard.angularVelocity *= this.config.physics.rotationDamping;

            if (Math.abs(postcard.velocity.x) < this.config.physics.minSpeed) postcard.velocity.x = 0;
            if (Math.abs(postcard.velocity.y) < this.config.physics.minSpeed) postcard.velocity.y = 0;
            if (Math.abs(postcard.angularVelocity) < this.config.physics.minSpeed) postcard.angularVelocity = 0;

            this.state.postcards.forEach(other => {
                if (other !== postcard && this.checkCollision(postcard, other)) {
                    this.resolveCollision(postcard, other);
                }
            });

            gsap.set(postcard.element, {
                x: postcard.x,
                y: postcard.y,
                rotation: postcard.rotation
            });
        });

        if (!this.state.isDraggingScene) {
            this.updateBounds();
        }

        requestAnimationFrame(this.animate.bind(this));
    }
}

// Initialize
preloadImages().then(() => {
    new SlidingPostcards();
}); 