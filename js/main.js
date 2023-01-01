let cardUidCount = 0;
let cards = {};
let piles = {}
let players = {};

let activePile = undefined;
let activeAction = undefined;
let scryPile = undefined;
let loadPile = undefined;

function host(){
	let username = $("#dbOpponent").val();
	dbClient.connectOpponent(username);
}

function login(){
	let username = $("#dbUser").val();
	let password = $("#dbPass").val();
	
	setup();
	
	dbClient = new DBClient(username,password);
}

function setup(){
	player1 = new Player(1);//upper
	player2 = new Player(2);//lower
	
	player1.lifeDisplay = $('#player1LifeDisplay');
	player2.lifeDisplay = $('#player2LifeDisplay');
	
	player1.piles.hand.faceUp = false;//cant see opps hand.
}

$(document).ready(()=>{

	window.addEventListener("contextmenu", e => e.preventDefault());
	window.addEventListener("mousedown", function(e){ if(e.button == 1){ e.preventDefault(); } });
	
	/*if(localStorage.getItem("db_id")){
		setup();
		dbClient = new DBClient();
	}*/
	
});