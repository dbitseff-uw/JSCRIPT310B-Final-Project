describe('Blackjack Tests', function() {
  it('should create a deck of 52 cards', function() {
    const deck = getDeck();
    expect(deck.length).toBe(52);
  });

  it('should create a CardPlayer with a name', function() {
    const player = new CardPlayer('Test');
    expect(player.name).toBe('Test');
    expect(Array.isArray(player.hand)).toBe(true);
  });

  it('should calculate points for a hand with Ace and King as 21', function() {
    const hand = [
      { val: 1, displayVal: 'A', suit: 'Spades' },
      { val: 10, displayVal: 'K', suit: 'Hearts' }
    ];
    const score = calcPoints(hand);
    expect(score.total).toBe(21);
  });

  it('should calculate points for a hand with 2 and 3 as 5', function() {
    const hand = [
      { val: 2, displayVal: '2', suit: 'Clubs' },
      { val: 3, displayVal: '3', suit: 'Diamonds' }
    ];
    const score = calcPoints(hand);
    expect(score.total).toBe(5);
  });
});
