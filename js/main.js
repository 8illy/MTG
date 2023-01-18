let cardUidCount = 0;
let cards = {};
let piles = {}
let players = {};

let activePile = undefined;
let activeAction = undefined;
let scryPile = undefined;
let loadPile = undefined;

let actionParam = "red";

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


function loadReplay(deckFile){	
	//read the file.
	let fr=new FileReader();
            
	fr.onload= ()=>{
		//rawDeckList = fr.result; // bad change this later :)
		setup();
		dbClient =  new Replay(JSON.parse(fr.result))
	}
          
	fr.readAsText(deckFile);
}

function setup(){
	player1 = new Player(1);//upper
	player2 = new Player(2);//lower
	
	player1.colour = "red";
	player2.colour="green";
	
	player1.lifeDisplay = $('#player1LifeDisplay');
	player2.lifeDisplay = $('#player2LifeDisplay');
	
	player1.piles.hand.faceUp = false;//cant see opps hand.
}

$(document).ready(()=>{

	window.addEventListener("contextmenu", e => e.preventDefault());
	window.addEventListener("mousedown", function(e){ if(e.button == 1){ e.preventDefault(); } });
	
	let loginData = localStorage.getItem("loginData")
	if(loginData){
		let dbUserSelector = $("#dbUserSelector");
		loginData = JSON.parse(loginData);
		for(let i in loginData){
			dbUserSelector.append(`<option value="${i}">${i}</option>`);
		}
		$("#dbUserSelector").change(function(){
			if($(this).val()){
				$("#dbUser").val($(this).val());
				$("#dbPass").val(loginData[$(this).val()]);
				login();
			}
		});
	}else{
		$("#dbUserSelector").hide();
	}
	
/*	$(".sidebarBox").hide(); */
	
	$("#sidebarBoxTabStrip > .sidebarBoxTabStripItem").click(function(){
		let selClass="sidebarBoxTabStripItemSelected";
		$("."+selClass).removeClass(selClass);
		$(this).addClass(selClass);
		
		let selBoxClass="sidebarBoxSelected";
		$("."+selBoxClass).removeClass(selBoxClass);
		$($(this).attr("tabContent")).addClass(selBoxClass);
	});
	
	$("#sidebarBoxTabStrip > .sidebarBoxTabStripItem").eq(0).click();
	
	/*if(localStorage.getItem("db_id")){
		setup();
		dbClient = new DBClient();
	}*/
	
});