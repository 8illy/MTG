class Game{
	
	constructor(){
		this.cards = {};
		this.piles = {}
		this.players = {};

		this.player1 = undefined;
		this.player2 = undefined;
		this.dbClient = undefined;

		this.activePile = undefined;
		this.scryPile = undefined;
		this.loadPile = undefined;
		
		this.ui = new UI();
		this.ui.prepareLoginScreen();
	}
	
	get isReplay(){
		return this.dbClient instanceof Replay;
	}
	
	host(){
		this.dbClient.connectOpponent(this.ui.opponent);
	}

	login(){
		this.ui.loading();
		//this.setup();
		this.dbClient = new DBClient(this.ui.username,this.ui.password);
	}
	
	enablePracticeMode(){
		this.setup();
		this.dbClient = new DBClient();
		this.ui.enablePracticeMode();
	}
	
	getPlayer(playerName){
		return this.players[playerName]?this.players[playerName]:undefined;
	}
	
	getCard(uid){
		return this.cards[uid]?this.cards[uid]:undefined;
	}
	
	getPile(playerName,pile){
		return this.piles[playerName]?this.piles[playerName][pile]:undefined;
	}
	
	loadReplay(deckFile){	
		//read the file.
		let fr=new FileReader();
				
		fr.onload= ()=>{
			//rawDeckList = fr.result; // bad change this later :)
			this.setup();
			this.dbClient = new Replay(JSON.parse(fr.result))
		}
			
		fr.readAsText(deckFile);
	}
	
	setup(){
		if(!this.player1){
			this.player1 = new Player(1);//upper
			this.player1.colour = "red";
			this.player1.lifeDisplay = this.ui.p1LifeDisplay;
		}else{
			this.player1.emptyPiles();
		}
		
		if(!this.player2){
			this.player2 = new Player(2);//lower
			this.player2.colour="green";
			this.player2.lifeDisplay = this.ui.p2LifeDisplay;
		}else{
			this.player2.emptyPiles();
		}

		this.player1.piles.hand.faceUp = false;//cant see opps hand.
	}
	
	rollDice(d){
		let result = Math.ceil(Math.random() * d);
		this.dbClient.sendToOpponent({
			"action" : "Dice",
			"dice" : d,
			"result" : result,
		});
	}

	flipCoin(){
		let result = Math.ceil(Math.random() * 2);
		this.dbClient.sendToOpponent({
			"action" : "Coin",
			"result" : result,
		});
	}
	
	loadNewCards(search){
		let headers = {
			"Content-Type" : "application/json",
		}
		
		search = search?search:prompt("Search");
		
		doRequest("https://api.scryfall.com/cards/search?order=cmc&q="+encodeURIComponent(search),"GET",{},headers,(resp)=>{
			this.loadPile = new Pile();
			this.piles["loadNewCards"] = {};
			this.loadPile.setPlayer({
				player : "loadNewCards",
				cardUidCount : 1,
			});
			let respData = JSON.parse(resp).data;
			for(let cardData of respData){
				this.loadPile.addCard(cardData);
			}
			this.loadPile.viewPile();
		});
	}
	
	
	importDeck(deckFile){
		$("#deckInput").hide();
		
		//read the file.
		let fr=new FileReader();
				
		fr.onload= ()=>{
			//rawDeckList = fr.result; // bad change this later :)
			
			if(!this.player2){
				this.enablePracticeMode();
			}
			
			this.processDeckList(fr.result,this.player2);

			this.ui.showField();
		}
			
		fr.readAsText(deckFile);
	}
	
	
	
	processDeckList(rawTxt,ownerPlayer){
		//ownerPlayer.rawTxtDecklist = rawTxt;//outdated, as will change this for commander
		
		let lines = rawTxt.split(/\r?\n/);
		let sideLines = [];
		lines = lines.filter(function(e){return !!e.trim()});

		let sideboardIndex = lines.findIndex(function(a){
			return a=="" || a.match(/sideboard/gi)
		});
	
		if(sideboardIndex!=-1){
			sideLines = lines.slice(sideboardIndex+1);
			lines = lines.slice(0,sideboardIndex);
		}	
		//get quantities & card names
		lines = lines.map(function(e){
			let parts = e.split(" ");
			return {
				quantity : Number(parts.shift()),
				name : parts.join(" "),	
			}
		});
		
		sideLines = sideLines.map(function(e){
			let parts = e.split(" ");
			return {
				quantity : Number(parts.shift()),
				name : parts.join(" "),	
			}
		});
		
		ownerPlayer.originalDeckList = lines;
		ownerPlayer.originalSideDeckList = sideLines;
		
		ownerPlayer.loadDeck();
		
	
		
	}
	
}