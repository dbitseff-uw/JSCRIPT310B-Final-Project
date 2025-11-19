/**
 * Returns an array of 52 Cards
 * @returns {Array} deck - a deck of cards
 */
const getDeck = () => {
  // code here
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  //const suits = ['&hearts;', '&diams;', '&clubs;', '&spades;'];
  const displayValues = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K'
  };
  const deck = [];
  for (let suit of suits) {
    for (let val = 1; val <= 13; val++) {
      const displayVal = displayValues[val] || val.toString();
      const cardVal = val > 10 ? 10 : val; 
      deck.push({ val: cardVal, suit, displayVal });
    }   
  }
  return deck;
}

// CHECKS
const deck = getDeck()
console.log(`Deck length equals 52? ${deck.length === 52}`)

const randomCard = deck[Math.floor(Math.random() * 52)]

const cardHasVal =
  randomCard && randomCard.val && typeof randomCard.val === 'number'
console.log(`Random card has val? ${cardHasVal}`)

const cardHasSuit =
  randomCard && randomCard.suit && typeof randomCard.suit === 'string'
console.log(`Random card has suit? ${cardHasSuit}`)

const cardHasDisplayVal =
  randomCard &&
  randomCard.displayVal &&
  typeof randomCard.displayVal === 'string'
console.log(`Random card has display value? ${cardHasDisplayVal}`)
console.log('Random card:', randomCard);
