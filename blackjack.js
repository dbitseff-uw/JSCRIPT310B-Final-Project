const blackjackDeck = getDeck();

/**
 * Represents a card player (including dealer).
 * @constructor
 * @param {string} name - The name of the player
 */
class CardPlayer {
    constructor(name) { 
        this.name = name;
        this.hand = [];
    }
    drawCard() {
        const randomIndex = Math.floor(Math.random() * blackjackDeck.length);
        const drawnCard = blackjackDeck[randomIndex];
        blackjackDeck.splice(randomIndex, 1); // Remove drawn card from deck
        this.hand.push(drawnCard);
        return drawnCard;
    }
    
    /**
     * Static method to create a new game with fresh players
     * @param {string} playerName - The name of the player
     * @returns {Object} Object containing dealer and player instances
     */
    static createNewGame(playerName = 'Player') {
        return {
            dealer: new CardPlayer('Dealer'),
            player: new CardPlayer(playerName)
        };
    }
}

// Game state
let dealer = null;
let player = null;
let gameInProgress = false;
let deckId = null; // Deck of Cards API deck ID
let cardImages = {}; // Store card image URLs

// LOCAL STORAGE: Game statistics
const stats = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    ties: 0
};

/**
 * Load statistics from local storage
 */
const loadStats = () => {
    const saved = localStorage.getItem('blackjackStats');
    if (saved) {
        const parsed = JSON.parse(saved);
        stats.gamesPlayed = parsed.gamesPlayed || 0;
        stats.wins = parsed.wins || 0;
        stats.losses = parsed.losses || 0;
        stats.ties = parsed.ties || 0;
    }
    updateStatsDisplay();
};

/**
 * Save statistics to local storage
 */
const saveStats = () => {
    localStorage.setItem('blackjackStats', JSON.stringify(stats));
    updateStatsDisplay();
};

/**
 * Update statistics display
 */
const updateStatsDisplay = () => {
    if(document.getElementById('games-played')) document.getElementById('games-played').textContent = stats.gamesPlayed;
    if(document.getElementById('wins')) document.getElementById('wins').textContent = stats.wins;
    if(document.getElementById('losses')) document.getElementById('losses').textContent = stats.losses;
    if(document.getElementById('ties')) document.getElementById('ties').textContent = stats.ties;
};

/**
 * FETCH API: Initialize a new deck from deckofcardsapi.com
 */
const fetchDeckImages = async () => {
    try {
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const data = await response.json();
        deckId = data.deck_id;
        console.log('Deck of Cards API initialized with deck ID:', deckId);
        
        // Build card image mapping
        const suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        suits.forEach(suit => {
            values.forEach(value => {
                // Deck of Cards API uses '0' for 10
                const apiCode = value === '10' ? '0' : value;
                const code = `${apiCode}${suit.charAt(0)}`;
                cardImages[`${value}_${suit}`] = `https://deckofcardsapi.com/static/img/${code}.png`;
            });
        });
        
        console.log('Card images loaded from Deck of Cards API');
    } catch (error) {
        console.error('Failed to fetch deck from API:', error);
    }
};

/**
 * Get card image URL from the API
 * @param {Object} card - Card object with displayVal and suit
 * @returns {string} Image URL for the card
 */
const getCardImageUrl = (card) => {
    const key = `${card.displayVal}_${card.suit.toUpperCase()}`;
    return cardImages[key] || '';
};

/**
 * Calculates the score of a Blackjack hand
 * @param {Array} hand - Array of card objects with val, displayVal, suit properties
 * @returns {Object} blackJackScore
 * @returns {number} blackJackScore.total
 * @returns {boolean} blackJackScore.isSoft
 */
const calcPoints = (hand) => {
    let total = 0;  
    let aceCount = 0;

    for (let card of hand) {
        if (card.displayVal === 'A') {
            aceCount += 1;
            total += 11; // Start by counting Ace as 11
        } else {
            total += card.val;
        }
    }   
    // Adjust for Aces if total is over 21
    while (total > 21 && aceCount > 0) {
        total -= 10; // Convert an Ace from 11 to 1
        aceCount -= 1;
    }   
    return { total, isSoft: aceCount > 0 };    
}

/**
 * Determines whether the dealer should draw another card.
 * 
 * @param {Array} dealerHand Array of card objects with val, displayVal, suit properties
 * @returns {boolean} whether dealer should draw another card
 */
const dealerShouldDraw = (dealerHand) => {
    const score = calcPoints(dealerHand);
    // Dealer must draw on 16 or less, or on a soft 17
    return score.total < 17 || (score.total === 17 && score.isSoft);    
}

/**
 * Get suit symbol
 */
const getSuitEntity = (suit) => {
  switch(suit.toLowerCase()) {
    case 'hearts':      
        return '♥';
    case 'diamonds':
        return '♦';
    case 'clubs':
        return '♣';
    case 'spades':
        return '♠';
    default:
        return '';
  }
}

/**
 * Logs the player's hand to the console and displays in HTML
 * @param {CardPlayer} cardPlayer 
 */
const showHand = (cardPlayer) => {
  const displayHand = cardPlayer.hand.map((card) => card.displayVal);
  console.log(`${cardPlayer.name}'s hand is ${displayHand.join(', ')} (${calcPoints(cardPlayer.hand).total})`);
  
  const handElementId = cardPlayer.name === 'Player' || cardPlayer.name !== 'Dealer' ? 'player-hand' : 'dealer-hand';
  const handElement = document.getElementById(handElementId);
  handElement.innerHTML = '';   
    //for (let card of cardPlayer.hand) { 
    for (let i = 0; i < cardPlayer.hand.length; i++) {
        const card = cardPlayer.hand[i];
        const listItem = document.createElement('li');
        
        // Add card image if available
        const imageUrl = i === 0 && handElementId === 'dealer-hand' && gameInProgress ? 'https://deckofcardsapi.com/static/img/back.png' : getCardImageUrl(card);
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `${card.displayVal} of ${card.suit}`;
            img.className = 'card-image';
            listItem.appendChild(img);
        } else {
            // Fallback to text display
            listItem.textContent = `${card.displayVal} of ${getSuitEntity(card.suit)}`;
            if(card.suit.toLowerCase() === 'hearts' || card.suit.toLowerCase() === 'diamonds') {
                listItem.style.color = 'red';
            }
        }
        handElement.appendChild(listItem);            
    }
}


/**
 * TIMING FUNCTION: Deal card with animation delay
 * @param {CardPlayer} cardPlayer 
 * @param {number} delay 
 */
const dealCardWithDelay = (cardPlayer, delay) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const card = cardPlayer.drawCard();
            showHand(cardPlayer);
            resolve(card);
        }, delay);
    });
};

/**
 * Determines the winner and updates stats
 * @param {number} playerScore 
 * @param {number} dealerScore 
 */
const determineWinner = (playerScore, dealerScore) => {
    const resultElement = document.getElementById('result');
    stats.gamesPlayed++;
    
    if (playerScore > dealerScore) {
        stats.wins++;
        resultElement.innerHTML = `Player wins! Player score: ${playerScore}, Dealer score: ${dealerScore}`;        
    } else if (dealerScore > playerScore) {
        stats.losses++;
        resultElement.innerHTML = `Player loses! Player score: ${playerScore}, Dealer score: ${dealerScore}`;        
    } else {
        stats.ties++;
        resultElement.innerHTML = `It's a tie! Player score: ${playerScore}, Dealer score: ${dealerScore}`;        
    }
    
    saveStats();
    gameInProgress = false;
    showHand(dealer); // Reveal dealer's hand
}

/**
 * Handle player hit
 */
const handleHit = async () => {
    if (!gameInProgress) return;
    
    await dealCardWithDelay(player, 300);
    const playerScore = calcPoints(player.hand).total;
    
    if (playerScore > 21) {
        stats.gamesPlayed++;
        stats.losses++;
        saveStats();
        document.getElementById('result').innerHTML = 'Player Busted - Player loses!';
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
        gameInProgress = false;
        showHand(dealer); // Reveal dealer's hand
    }
};

/**
 * Handle player stand
 */
const handleStand = async () => {
    if (!gameInProgress) return;
    
    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
    
    const playerScore = calcPoints(player.hand).total;
    document.getElementById('result').innerHTML = `Player stands at ${playerScore}`;
    console.log(`Player stands at ${playerScore}`);
    
    // Reveal dealer's hand
    gameInProgress = false;
    showHand(dealer);
    gameInProgress = true;
    
    let dealerScore = calcPoints(dealer.hand).total;
    
    if (dealerScore === 21) {
        stats.gamesPlayed++;
        stats.losses++;
        saveStats();
        document.getElementById('result').innerHTML = 'Dealer has Blackjack! Player loses!';
        gameInProgress = false;
        showHand(dealer);
        return;
    }
    
    // Dealer draws with delays
    while (dealerScore < 21 && dealerShouldDraw(dealer.hand)) {
        await dealCardWithDelay(dealer, 800);
        dealerScore = calcPoints(dealer.hand).total;
    }
    
    if (dealerScore > 21) {
        stats.gamesPlayed++;
        stats.wins++;
        saveStats();
        document.getElementById('result').innerHTML = 'Dealer Busted! - Player wins!';
        gameInProgress = false;
        showHand(dealer);
        return;
    }
    
    console.log(`Dealer stands at ${dealerScore}`);
    determineWinner(playerScore, dealerScore);
};

/**
 * Validate player name form
 */
const validatePlayerName = (name) => {
    const errorElement = document.getElementById('name-error');
    
    if (!name || name.trim().length === 0) {
        errorElement.textContent = 'Name is required';
        return false;
    }
    
    if (name.trim().length < 2) {
        errorElement.textContent = 'Name must be at least 2 characters';
        return false;
    }
    
    if (name.trim().length > 20) {
        errorElement.textContent = 'Name must be 20 characters or less';
        return false;
    }
    
    errorElement.textContent = '';
    return true;
};

/**
 * Start the game
 */
const startGame = async () => {
    // Reset deck
    blackjackDeck.length = 0;
    blackjackDeck.push(...getDeck());
    
    // Create new players
    const playerName = document.getElementById('player-name').value.trim();
    const newGame = CardPlayer.createNewGame(playerName);
    dealer = newGame.dealer;
    player = newGame.player;
    
    gameInProgress = true;
    
    // Show game area, hide setup
    document.getElementById('setup-area').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('player-name-display').textContent = `${player.name}'s Hand`;
    
    // Clear previous game
    document.getElementById('result').innerHTML = '';
    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    
    // Deal initial cards with delays
    await dealCardWithDelay(player, 300);
    await dealCardWithDelay(dealer, 600);
    await dealCardWithDelay(player, 900);
    await dealCardWithDelay(dealer, 1200);
    
    const playerScore = calcPoints(player.hand).total;
    const dealerScore = calcPoints(dealer.hand).total;
    
    // Check for blackjack
    if (playerScore === 21) {
        if (dealerScore === 21) {
            stats.gamesPlayed++;
            stats.ties++;
            saveStats();
            document.getElementById('result').innerHTML = `Both have Blackjack! It's a draw!`;
            gameInProgress = false;
            showHand(dealer); // Reveal dealer's hand
            document.getElementById('hit-btn').disabled = true;
            document.getElementById('stand-btn').disabled = true;
        } else {
            stats.gamesPlayed++;
            stats.wins++;
            saveStats();
            document.getElementById('result').innerHTML = 'Blackjack! Player wins!';
            gameInProgress = false;
            showHand(dealer); // Reveal dealer's hand
            document.getElementById('hit-btn').disabled = true;
            document.getElementById('stand-btn').disabled = true;
        }
    } else if (dealerScore === 21) {
        // Dealer has blackjack, player doesn't
        stats.gamesPlayed++;
        stats.losses++;
        saveStats();
        document.getElementById('result').innerHTML = 'Dealer has Blackjack! Player loses!';
        gameInProgress = false;
        showHand(dealer); // Reveal dealer's hand
        document.getElementById('hit-btn').disabled = true;
        document.getElementById('stand-btn').disabled = true;
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load stats and fetch card images on page load
    loadStats();
    fetchDeckImages();
    
    // Form validation and submission
    if(document.getElementById('player-form')){
        document.getElementById('player-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const playerName = document.getElementById('player-name').value.trim();
            
            if (validatePlayerName(playerName)) {
                startGame();
            }
        });
    }
    
    // Game controls
    if(document.getElementById('hit-btn')) document.getElementById('hit-btn').addEventListener('click', handleHit);
    if(document.getElementById('stand-btn')) document.getElementById('stand-btn').addEventListener('click', handleStand);

    // New game button
    if(document.getElementById('new-game-btn')) document.getElementById('new-game-btn').addEventListener('click', () => {
        document.getElementById('setup-area').style.display = 'block';
        document.getElementById('game-area').style.display = 'none';
    });
});