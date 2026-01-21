// Lottery Machine JavaScript
let isSpinning = false;
let currentResult = null;
let tumblingInterval = null;

// Get all possible selections including special balls
function getAllSelections(min, max) {
    const selections = [];
    
    // Add number range
    for (let i = min; i <= max; i++) {
        selections.push(i.toString());
    }
    
    // Add special balls if enabled
    if (document.getElementById('includeZero')?.checked) {
        selections.push('0');
    }
    if (document.getElementById('includeDoubleZero')?.checked) {
        selections.push('00');
    }
    if (document.getElementById('includeJackpot')?.checked) {
        selections.push('JP');
    }
    
    return selections;
}

// Get random selection from all possible options
function getRandomSelection(min, max) {
    const selections = getAllSelections(min, max);
    if (selections.length === 0) {
        return '1'; // Default fallback
    }
    return selections[Math.floor(Math.random() * selections.length)];
}

// Update range display
function updateRangeDisplay() {
    const minNum = parseInt(document.getElementById('minNumber').value) || 1;
    const maxNum = parseInt(document.getElementById('maxNumber').value) || 69;
    let display = `${minNum} - ${maxNum}`;
    
    // Add special balls indicator
    const specialBalls = [];
    if (document.getElementById('includeZero')?.checked) {
        specialBalls.push('0');
    }
    if (document.getElementById('includeDoubleZero')?.checked) {
        specialBalls.push('00');
    }
    if (document.getElementById('includeJackpot')?.checked) {
        specialBalls.push('JP');
    }
    
    if (specialBalls.length > 0) {
        display += ` (+ ${specialBalls.join(', ')})`;
    }
    
    document.getElementById('rangeDisplay').textContent = display;
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
        const selection = getRandomSelection(min, max);
        ball.textContent = selection;
        
        // Special styling for JP ball
        if (selection === 'JP') {
            ball.classList.add('jackpot-ball');
        } else if (selection === '0' || selection === '00') {
            ball.classList.add('zero-ball');
        }
        
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
function showOutputBall(selection) {
    const outputBall = document.getElementById('outputBall');
    const outputNumber = document.getElementById('outputNumber');
    
    outputBall.style.display = 'flex';
    outputNumber.textContent = selection;
    
    // Apply special styling
    outputBall.classList.remove('jackpot-ball', 'zero-ball');
    if (selection === 'JP') {
        outputBall.classList.add('jackpot-ball');
    } else if (selection === '0' || selection === '00') {
        outputBall.classList.add('zero-ball');
    }
    
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
    const resultLabel = document.getElementById('resultLabel');
    const outputBall = document.getElementById('outputBall');
    
    // Disable button and update UI
    spinButton.disabled = true;
    spinButton.textContent = '🎲 SPINNING...';
    
    // Hide previous result
    resultDisplay.style.display = 'none';
    resultBall.classList.remove('revealed');
    resultNumber.textContent = '?';
    outputBall.style.display = 'none';
    
    // Generate the random selection (including special balls)
    currentResult = getRandomSelection(minNum, maxNum);
    
    // Start tumbling balls animation
    createTumblingBalls(minNum, maxNum);
    
    // Show number flashes in output chute
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        const flashSelection = getRandomSelection(minNum, maxNum);
        showOutputBall(flashSelection);
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
                resultBall.classList.remove('jackpot-ball', 'zero-ball');
                
                // Apply special styling to result ball
                if (currentResult === 'JP') {
                    resultBall.classList.add('jackpot-ball');
                    resultLabel.textContent = '🎰🎰🎰 JACKPOT! 🎰🎰🎰';
                } else {
                    resultLabel.textContent = '🎉 Winning Number Selected!';
                }
                
                if (currentResult === '0' || currentResult === '00') {
                    resultBall.classList.add('zero-ball');
                }
                
                resultDisplay.style.display = 'flex';
                
                // Trigger reveal animation
                setTimeout(() => {
                    resultBall.classList.add('revealed');
                    
                    // Extra celebration for jackpot
                    if (currentResult === 'JP') {
                        celebrateJackpot();
                    } else {
                        celebrate();
                    }
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

// Extra special celebration for jackpot
function celebrateJackpot() {
    // Create massive confetti explosion
    const colors = ['#FFD700', '#FF6347', '#00CED1', '#32CD32', '#FF1493', '#FFA500', '#9370DB', '#FF00FF', '#00FF00', '#0000FF'];
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            createConfettiParticle(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 20);
    }
    
    // Add tons of sparkles
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createSparkle();
        }, i * 50);
    }
    
    // Extra special sparkles for JP
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            createJPSparkle();
        }, i * 150);
    }
}

function createJPSparkle() {
    const sparkle = document.createElement('div');
    sparkle.style.position = 'fixed';
    sparkle.style.width = '8px';
    sparkle.style.height = '8px';
    sparkle.style.background = '#FFD700';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    sparkle.style.borderRadius = '50%';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '9999';
    sparkle.style.boxShadow = '0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700';
    sparkle.style.animation = 'sparkleFade 2s ease-out';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        if (document.body.contains(sparkle)) {
            document.body.removeChild(sparkle);
        }
    }, 2000);
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
            const selection = getRandomSelection(minNum, maxNum);
            ball.textContent = selection;
            
            // Special styling for special balls
            if (selection === 'JP') {
                ball.classList.add('jackpot-ball');
            } else if (selection === '0' || selection === '00') {
                ball.classList.add('zero-ball');
            }
            
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
