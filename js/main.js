let cardUidCount = 0;
let cards = {};
let piles = {}
let players = {};

let activePile = undefined;
let activeAction = undefined;
let scryPile = undefined;
let loadPile = undefined;

function login(){
	let username = $("#dbUser").val();
	let password = $("#dbPass").val();
	
	player1 = new Player(1);//upper
	player2 = new Player(username);//lower
	
	player1.lifeDisplay = $('#player1LifeDisplay');
	player2.lifeDisplay = $('#player2LifeDisplay');
	
	$('label[for="player2Life"]').text(username);
	
	player1.piles.hand.faceUp = false;//cant see opps hand.
	
	dbClient = new DBClient(username,password);
}

$(document).ready(()=>{

	window.addEventListener("contextmenu", e => e.preventDefault());
	window.addEventListener("mousedown", function(e){ if(e.button == 1){ e.preventDefault(); } });
	
	//if(localStorage.getItem("login")){
	//	login();
	//}
	//let urlParams = new URL(window.location).searchParams;
	//
	//let username = urlParams.get("username");
	//let password = urlParams.get("password")
	
	

});