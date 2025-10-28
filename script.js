/*
cardEl.addEventListener('click', onCardClick);
boardEl.appendChild(cardEl);
});
}


function onCardClick(e){
const target = e.currentTarget;
if(state.lockBoard) return;
if(target.classList.contains('flipped')) return;
flipCard(target);
if(!state.firstCard){
state.firstCard = target; return;
}
state.secondCard = target;
state.lockBoard = true;
// compare
const firstPair = state.firstCard.dataset.pair;
const secondPair = state.secondCard.dataset.pair;
if(firstPair === secondPair){
// match
state.matchesFound += 1;
playSound('match');
state.firstCard.removeEventListener('click', onCardClick);
state.secondCard.removeEventListener('click', onCardClick);
resetTurn();
// check finish
const totalPairs = state.boardCards.length / 2;
if(state.matchesFound >= totalPairs){
// level complete
onLevelComplete();
}
} else {
playSound('flip');
setTimeout(()=>{
unflipCard(state.firstCard);
unflipCard(state.secondCard);
resetTurn();
}, 900);
}
}


function flipCard(cardEl){
cardEl.classList.add(
