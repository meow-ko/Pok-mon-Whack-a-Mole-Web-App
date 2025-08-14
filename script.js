document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('high-score');
    const comboDisplay = document.getElementById('combo');
    const startButton = document.getElementById('start-btn');
    const eventNotification = document.getElementById('event-notification');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const playAgainButton = document.getElementById('play-again-btn');
    
    // Audio Elements
    const throwSound = document.getElementById('throw-sound');
    const catchSound = document.getElementById('catch-sound');
    const gameoverSound = document.getElementById('gameover-sound');
    const backgroundMusic = document.getElementById('background-music');
    
    // Game State
    let score = 0;
    let highScore = localStorage.getItem('pokemonWhackHighScore') || 0;
    let combo = 1;
    let comboTimeout;
    let consecutiveCatches = 0;
    let samePokemonCount = 0;
    let lastPokemonCaught = '';
    let gameInterval;
    let isPlaying = false;
    let difficulty = 'medium'; // Default difficulty
    let gameSpeed = 1500; // Default speed (ms between pops)
    
    // Pokémon Data with unique sounds
    const pokemons = [
        { 
            name: 'Pikachu', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', 
            points: 10, 
            soundId: 'pikachu-sound'
        },
        { 
            name: 'Bulbasaur', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png', 
            points: 15, 
            soundId: 'bulbasaur-sound'
        },
        { 
            name: 'Charmander', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png', 
            points: 15, 
            soundId: 'charmander-sound'
        },
        { 
            name: 'Squirtle', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png', 
            points: 15, 
            soundId: 'squirtle-sound'
        },
        { 
            name: 'Jigglypuff', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png', 
            points: 20, 
            soundId: 'jigglypuff-sound'
        },
        { 
            name: 'Meowth', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png', 
            points: 20, 
            soundId: 'meowth-sound'
        },
        { 
            name: 'Psyduck', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png', 
            points: 25, 
            soundId: 'psyduck-sound'
        },
        { 
            name: 'Snorlax', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png', 
            points: 30, 
            soundId: 'snorlax-sound'
        },
        { 
            name: 'Zubat', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/41.png', 
            isZubat: true, 
            soundId: 'zubat-sound'
        },
        { 
            name: 'Mewtwo', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png', 
            points: 100, 
            isLegendary: true, 
            soundId: 'mewtwo-sound'
        },
        { 
            name: 'Mew', 
            img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png', 
            points: 100, 
            isLegendary: true, 
            soundId: 'mew-sound'
        }
    ];
    
    // Initialize Game
    function initGame() {
        // Create holes
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.className = 'hole';
            hole.innerHTML = '<div class="pokemon"></div>';
            hole.addEventListener('click', whackPokemon);
            gameBoard.appendChild(hole);
        }
        
        // Set initial values
        highScoreDisplay.textContent = highScore;
        comboDisplay.textContent = '1x';
        
        // Preload sounds
        preloadSounds();
        
        // Set sources for non-pokemon sounds
        throwSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-short-whistle-throw-233.mp3';
        catchSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3';
        gameoverSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-over-213.mp3';
        backgroundMusic.src = 'https://assets.mixkit.co/music/preview/mixkit-game-show-suspense-waiting-668.mp3';
    }
    
    // Preload sounds for better performance
    function preloadSounds() {
        const sounds = [
            'pikachu-sound', 'bulbasaur-sound', 'charmander-sound',
            'squirtle-sound', 'jigglypuff-sound', 'meowth-sound',
            'psyduck-sound', 'snorlax-sound', 'zubat-sound',
            'mewtwo-sound', 'mew-sound'
        ];
        
        sounds.forEach(soundId => {
            const sound = document.getElementById(soundId);
            if (sound) {
                sound.volume = 0.5;
                sound.load();
            }
        });
    }
    
    // Set difficulty level
    function setDifficulty(level) {
        difficulty = level;
        
        // Update active button styling
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${level}-btn`).classList.add('active');
        
        // Set game speed based on difficulty
        switch(level) {
            case 'easy':
                gameSpeed = 2000; // 2 seconds
                break;
            case 'medium':
                gameSpeed = 1500; // 1.5 seconds
                break;
            case 'hard':
                gameSpeed = 1000; // 1 second
                break;
        }
        
        // If game is running, restart with new difficulty
        if (isPlaying) {
            clearInterval(gameInterval);
            gameInterval = setInterval(popRandomPokemon, gameSpeed);
        }
    }
    
    // Start Game
    function startGame() {
        if (isPlaying) return;
        
        isPlaying = true;
        score = 0;
        combo = 1;
        consecutiveCatches = 0;
        samePokemonCount = 0;
        lastPokemonCaught = '';
        
        scoreDisplay.textContent = score;
        comboDisplay.textContent = '1x';
        startButton.disabled = true;
        startButton.textContent = 'Game Running...';
        
        // Hide game over screen if visible
        gameOverScreen.classList.remove('show');
        
        // Play background music
        backgroundMusic.volume = 0.3;
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
        
        // Start the game loop with current speed
        gameInterval = setInterval(popRandomPokemon, gameSpeed);
    }
    
    // Game Over from Zubat
    function gameOver() {
        clearInterval(gameInterval);
        isPlaying = false;
        
        // Play game over sound
        gameoverSound.currentTime = 0;
        gameoverSound.play();
        
        // Stop background music
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        
        // Hide all pokemon
        document.querySelectorAll('.hole').forEach(hole => {
            hole.classList.remove('up', 'safe-to-click', 'avoid-click', 'shiny-pokemon');
        });
        
        // Show game over screen
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.add('show');
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem('pokemonWhackHighScore', highScore);
        }
    }
    
    // Pop Random Pokémon
    function popRandomPokemon() {
        if (!isPlaying) return;
        
        // Don't show more than 2 pokemon at once
        const currentlyUp = document.querySelectorAll('.hole.up');
        if (currentlyUp.length >= 2) return;
        
        // Select a random hole that isn't already up
        const availableHoles = Array.from(document.querySelectorAll('.hole')).filter(hole => !hole.classList.contains('up'));
        if (availableHoles.length === 0) return;
        
        const randomHoleIndex = Math.floor(Math.random() * availableHoles.length);
        const hole = availableHoles[randomHoleIndex];
        
        // Select a random pokemon with rarity consideration
        let pokemon;
        const rand = Math.random();
        
        // 2% chance for legendary
        if (rand < 0.02) {
            const legendaries = pokemons.filter(p => p.isLegendary);
            if (legendaries.length > 0) {
                pokemon = legendaries[Math.floor(Math.random() * legendaries.length)];
            } else {
                pokemon = getRandomRegularPokemon();
            }
        } 
        // 15% chance for Zubat
        else if (rand < 0.17) {
            pokemon = pokemons.find(p => p.isZubat);
        } 
        // 5% chance for shiny
        else if (rand < 0.22) {
            pokemon = getRandomRegularPokemon();
            pokemon.isShiny = true;
            pokemon.points *= 2; // Double points for shiny
        } 
        // Regular pokemon
        else {
            pokemon = getRandomRegularPokemon();
        }
        
        // Set the pokemon image and data
        const pokemonElement = hole.querySelector('.pokemon');
        pokemonElement.style.backgroundImage = `url(${pokemon.img})`;
        pokemonElement.dataset.name = pokemon.name;
        pokemonElement.dataset.points = pokemon.points || 0;
        pokemonElement.dataset.isZubat = pokemon.isZubat || false;
        pokemonElement.dataset.isShiny = pokemon.isShiny || false;
        pokemonElement.dataset.isLegendary = pokemon.isLegendary || false;
        pokemonElement.dataset.soundId = pokemon.soundId;
        
        // Play pokemon's unique cry
        if (pokemon.soundId) {
            const sound = document.getElementById(pokemon.soundId);
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log('Sound play failed:', e));
            }
        }
        
        // Show the pokemon with appropriate glow
        hole.classList.remove('safe-to-click', 'avoid-click', 'shiny-pokemon');
        
        if (pokemon.isZubat) {
            hole.classList.add('avoid-click');
        } else if (pokemon.isShiny) {
            hole.classList.add('shiny-pokemon');
            showEventNotification('Shiny Pokémon!', 1500);
        } else if (pokemon.isLegendary) {
            hole.classList.add('shiny-pokemon');
            showEventNotification('Legendary Pokémon!', 1500);
        } else {
            hole.classList.add('safe-to-click');
        }
        
        hole.classList.add('up');
        
        // Hide the pokemon after a random time (1-2 seconds)
        setTimeout(() => {
            if (hole.classList.contains('up')) {
                hole.classList.remove('up', 'safe-to-click', 'avoid-click', 'shiny-pokemon');
                
                // Reset combo if pokemon escapes
                if (!pokemon.isZubat) {
                    resetCombo();
                }
            }
        }, Math.random() * 1000 + 1000);
    }
    
    function getRandomRegularPokemon() {
        const regularPokemon = pokemons.filter(p => !p.isZubat && !p.isLegendary);
        return {...regularPokemon[Math.floor(Math.random() * regularPokemon.length)]};
    }
    
    // Whack Pokémon
    function whackPokemon(e) {
        if (!isPlaying) return;
        
        const hole = e.target.classList.contains('hole') ? e.target : e.target.closest('.hole');
        if (!hole || !hole.classList.contains('up')) return;
        
        const pokemon = hole.querySelector('.pokemon');
        const isZubat = pokemon.dataset.isZubat === 'true';
        
        // Play throw sound
        throwSound.currentTime = 0;
        throwSound.play();
        
        // Visual feedback
        hole.classList.add('whacked');
        setTimeout(() => {
            hole.classList.remove('whacked', 'up', 'safe-to-click', 'avoid-click', 'shiny-pokemon');
        }, 200);
        
        // Handle Zubat click (game over)
        if (isZubat) {
            gameOver();
            return;
        }
        
        // Handle regular Pokémon catch
        const points = parseInt(pokemon.dataset.points);
        const isShiny = pokemon.dataset.isShiny === 'true';
        const isLegendary = pokemon.dataset.isLegendary === 'true';
        const name = pokemon.dataset.name;
        
        // Calculate actual points with combo multiplier
        const actualPoints = points * combo;
        score += actualPoints;
        scoreDisplay.textContent = score;
        
        // Play catch sound
        catchSound.currentTime = 0;
        catchSound.play();
        
        // Show catch message
        const catchMessage = document.createElement('div');
        catchMessage.className = 'catch-message';
        catchMessage.textContent = `Caught ${name}! +${actualPoints}`;
        hole.appendChild(catchMessage);
        
        setTimeout(() => {
            catchMessage.remove();
        }, 1000);
        
        // Combo system
        consecutiveCatches++;
        updateCombo();
        
        // Same Pokémon bonus
        if (lastPokemonCaught === name) {
            samePokemonCount++;
            if (samePokemonCount >= 3) {
                const bonus = 50 * combo;
                score += bonus;
                scoreDisplay.textContent = score;
                showEventNotification(`3 ${name}s in a row! +${bonus}`, 1500);
                samePokemonCount = 0;
            }
        } else {
            samePokemonCount = 1;
            lastPokemonCaught = name;
        }
        
        // Special events
        if (isShiny) {
            showEventNotification('Shiny Bonus!', 1500);
        }
        
        if (isLegendary) {
            showEventNotification('Legendary Bonus!', 1500);
        }
    }
    
    // Combo System
    function updateCombo() {
        clearTimeout(comboTimeout);
        
        if (consecutiveCatches >= 3) {
            combo = Math.min(combo + 1, 5);
            comboDisplay.textContent = `${combo}x`;
            showEventNotification(`Combo x${combo}!`, 1000);
        }
        
        comboTimeout = setTimeout(resetCombo, 3000);
    }
    
    function resetCombo() {
        combo = 1;
        consecutiveCatches = 0;
        comboDisplay.textContent = '1x';
    }
    
    // Event Notification
    function showEventNotification(message, duration = 2000) {
        eventNotification.textContent = message;
        eventNotification.classList.add('show');
        
        setTimeout(() => {
            eventNotification.classList.remove('show');
        }, duration);
    }
    
    // Play Again Button
    playAgainButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Start Button
    startButton.addEventListener('click', startGame);
    
    // Difficulty Buttons
    document.getElementById('easy-btn').addEventListener('click', () => setDifficulty('easy'));
    document.getElementById('medium-btn').addEventListener('click', () => setDifficulty('medium'));
    document.getElementById('hard-btn').addEventListener('click', () => setDifficulty('hard'));
    
    // Mobile Touch Support
    document.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('hole')) {
            e.preventDefault();
            whackPokemon(e);
        }
    }, { passive: false });
    
    // Initialize the game
    initGame();
});