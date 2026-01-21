// Lottery Machine JavaScript
let isSpinning = false;
let currentResult = null;
let tumblingInterval = null;

// Get random number within range
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Update range display
function updateRangeDisplay() {
    const minNum = parseInt(document.getElementById('minNumber').value) || 1;
    const maxNum = parseInt(document.getElementById('maxNumber').value) || 69;
    document.getElementById('rangeDisplay').textContent = `${minNum} - ${maxNum}`;
}

// Create floating/bouncing balls animation (air-puffed effect)
function createTumblingBalls(min, max) {
    const container = document.getElementById('tumblingBalls');
    
    // Clear existing balls
    if (tumblingInterval) {
        clearInterval(tumblingInterval);
    }
    
    // Create balls at different intervals for continuous floating
    tumblingInterval = setInterval(() => {
        if (!isSpinning) {
            clearInterval(tumblingInterval);
            return;
        }
        
        const ball = document.createElement('div');
        ball.className = 'tumbling-ball';
        const number = getRandomNumber(min, max);
        ball.textContent = number;
        
        // Random horizontal position (within dome bounds)
        const leftPosition = Math.random() * 70 + 15; // 15% to 85%
        const bottomPosition = Math.random() * 20 + 5; // Start from bottom 5-25%
        ball.style.left = `${leftPosition}%`;
        ball.style.bottom = `${bottomPosition}%`;
        
        // Random animation variation (3 different bounce patterns)
        const animationVariations = ['floatBounce', 'floatBounce2', 'floatBounce3'];
        const animation = animationVariations[Math.floor(Math.random() * 3)];
        
        // Random animation duration (slower for more visible floating)
        const duration = 1.5 + Math.random() * 1.5; // 1.5s to 3s
        
        ball.style.animation = `${animation} ${duration}s ease-in-out`;
        
        // Random starting rotation
        ball.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        container.appendChild(ball);
        
        // Remove ball after animation
        setTimeout(() => {
            if (container.contains(ball)) {
                container.removeChild(ball);
            }
        }, duration * 1000 + 100);
        
    }, 150); // Create new ball every 150ms during spin (more chaotic)
}

// Stop tumbling animation
function stopTumblingAnimation() {
    const container = document.getElementById('tumblingBalls');
    container.innerHTML = '';
    if (tumblingInterval) {
        clearInterval(tumblingInterval);
        tumblingInterval = null;
    }
}

// Show ball in output chute
function showOutputBall(number) {
    const outputBall = document.getElementById('outputBall');
    const outputNumber = document.getElementById('outputNumber');
    
    outputBall.style.display = 'flex';
    outputNumber.textContent = number;
    
    // Reset animation
    outputBall.style.animation = 'none';
    setTimeout(() => {
        outputBall.style.animation = 'ballDrop 0.8s ease-out';
    }, 10);
}

// Main spin function
function spinMachine() {
    if (isSpinning) return;
    
    const minNum = parseInt(document.getElementById('minNumber').value) || 1;
    const maxNum = parseInt(document.getElementById('maxNumber').value) || 69;
    
    // Validation
    if (minNum >= maxNum) {
        alert('❌ Minimum number must be less than maximum number');
        return;
    }
    
    if (minNum < 1 || maxNum > 999) {
        alert('❌ Number range must be between 1 and 999');
        return;
    }
    
    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    const resultDisplay = document.getElementById('resultDisplay');
    const resultBall = document.getElementById('resultBall');
    const resultNumber = document.getElementById('resultNumber');
    const outputBall = document.getElementById('outputBall');
    
    // Disable button and update UI
    spinButton.disabled = true;
    spinButton.textContent = '🎲 SPINNING...';
    
    // Hide previous result
    resultDisplay.style.display = 'none';
    resultBall.classList.remove('revealed');
    resultNumber.textContent = '?';
    outputBall.style.display = 'none';
    
    // Generate the random number
    currentResult = getRandomNumber(minNum, maxNum);
    
    // Start tumbling balls animation
    createTumblingBalls(minNum, maxNum);
    
    // Show number flashes in output chute
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        const flashNumber = getRandomNumber(minNum, maxNum);
        showOutputBall(flashNumber);
        flashCount++;
        
        // After flashing, reveal the actual result
        if (flashCount >= 20) {
            clearInterval(flashInterval);
            
            // Show actual result in chute
            setTimeout(() => {
                showOutputBall(currentResult);
            }, 200);
            
            // Stop tumbling and show final result
            setTimeout(() => {
                stopTumblingAnimation();
                
                // Show result display
                resultNumber.textContent = currentResult;
                resultDisplay.style.display = 'flex';
                
                // Trigger reveal animation
                setTimeout(() => {
                    resultBall.classList.add('revealed');
                    celebrate();
                }, 300);
                
                // Re-enable button
                isSpinning = false;
                spinButton.disabled = false;
                spinButton.textContent = '🎲 SPIN THE MACHINE';
            }, 1000);
        }
    }, 150);
}

// Celebration animation with confetti
function celebrate() {
    // Create confetti particles
    const colors = ['#FFD700', '#FF6347', '#00CED1', '#32CD32', '#FF1493', '#FFA500', '#9370DB'];
    
    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            createConfettiParticle(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 30);
    }
    
    // Add sparkle effects
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createSparkle();
        }, i * 100);
    }
}

function createConfettiParticle(color) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = Math.random() * 10 + 5 + 'px';
    confetti.style.background = color;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px ${color}`;
    
    document.body.appendChild(confetti);
    
    const endX = (Math.random() - 0.5) * 200;
    const endY = window.innerHeight + 100;
    const rotation = Math.random() * 720 - 360;
    
    requestAnimationFrame(() => {
        confetti.style.transition = 'all 3s ease-out';
        confetti.style.transform = `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`;
        confetti.style.opacity = '0';
    });
    
    setTimeout(() => {
        if (document.body.contains(confetti)) {
            document.body.removeChild(confetti);
        }
    }, 3000);
}

function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.style.position = 'fixed';
    sparkle.style.width = '4px';
    sparkle.style.height = '4px';
    sparkle.style.background = '#FFD700';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    sparkle.style.borderRadius = '50%';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '9999';
    sparkle.style.boxShadow = '0 0 10px #FFD700, 0 0 20px #FFD700';
    sparkle.style.animation = 'sparkleFade 1s ease-out';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        if (document.body.contains(sparkle)) {
            document.body.removeChild(sparkle);
        }
    }, 1000);
}

// Add sparkle animation
const style = document.createElement('style');
style.textContent = `
    @keyframes sparkleFade {
        0% {
            opacity: 0;
            transform: scale(0);
        }
        50% {
            opacity: 1;
            transform: scale(1.5);
        }
        100% {
            opacity: 0;
            transform: scale(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateRangeDisplay();
    
    // Update range display when inputs change
    document.getElementById('minNumber').addEventListener('input', updateRangeDisplay);
    document.getElementById('maxNumber').addEventListener('input', updateRangeDisplay);
    
    // Add idle animation (slow tumbling when not spinning)
    createIdleAnimation();
});

// Create slow idle balls when not spinning (gentle floating)
function createIdleAnimation() {
    const container = document.getElementById('tumblingBalls');
    
    setInterval(() => {
        if (!isSpinning && container.children.length < 5) {
            const minNum = parseInt(document.getElementById('minNumber').value) || 1;
            const maxNum = parseInt(document.getElementById('maxNumber').value) || 69;
            
            const ball = document.createElement('div');
            ball.className = 'tumbling-ball';
            ball.textContent = getRandomNumber(minNum, maxNum);
            
            // Random starting position
            const leftPosition = Math.random() * 70 + 15;
            const bottomPosition = Math.random() * 30 + 10;
            ball.style.left = `${leftPosition}%`;
            ball.style.bottom = `${bottomPosition}%`;
            
            // Use slower floating animation for idle
            const animationVariations = ['floatBounce', 'floatBounce2', 'floatBounce3'];
            const animation = animationVariations[Math.floor(Math.random() * 3)];
            const duration = 3 + Math.random() * 2; // 3-5s for slower idle
            
            ball.style.animation = `${animation} ${duration}s ease-in-out`;
            ball.style.opacity = '0.5';
            
            container.appendChild(ball);
            
            setTimeout(() => {
                if (container.contains(ball)) {
                    container.removeChild(ball);
                }
            }, duration * 1000 + 100);
        }
    }, 2000);
}
