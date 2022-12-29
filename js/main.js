let cardUidCount = 0;
let cards = {};
let piles = {}
let players = {};

let activePile = undefined;
let activeAction = undefined;
let scryPile = undefined;
let loadPile = undefined;

$(document).ready(()=>{

	window.addEventListener("contextmenu", e => e.preventDefault());
	window.addEventListener("mousedown", function(e){ if(e.button == 1){ e.preventDefault(); } });
	
	let urlParams = new URL(window.location).searchParams;
	let username = urlParams.get("username");
	let password = urlParams.get("password")
	
	player1 = new Player(1);//upper
	player2 = new Player(username);//lower
	
	player1.lifeDisplay = $('#player1LifeDisplay');
	player2.lifeDisplay = $('#player2LifeDisplay');
	
	$('label[for="player2Life"]').text(username);
	
	player1.piles.hand.faceUp = false;//cant see opps hand.
	
	dbClient = new DBClient(username,password);
	
	

	
	//for(let i = 0;i<60;i++){
	//	player2.piles.deck.addCard(debugCardData);
	//}
	//
	//for(let i = 0;i<7;i++){
	//	player2.draw();
	//}
	//
	//player2.render();
});