class Player{

	constructor(player){
		this.player = player;
		
		this.cardUidCount = 1;
		this.life = 20;
		
		this.setUpField();
		
		piles[this.player] = {};
		players[this.player] = this;
		
		
		this.piles = {
			deck : new Pile(PILE_DECK,false,false,this,"playerDeck"),
			hand : new Pile(PILE_HAND,true,true,this,"playerHand"),
			
			grave : new Pile(PILE_GRAVE,true,false,this,"playerGrave"),
			exile : new Pile(PILE_EXILE,true,false,this,"playerExiled"),
			
			creatures : new Pile(PILE_CREATURES,true,true,this,"playerCreatures"),
			artifacts : new Pile(PILE_ARTIFACTS,true,true,this,"playerArtifacts"),
			walkers : new Pile(PILE_WALKERS,true,true,this,"playerWalkers"),
			lands : new Pile(PILE_LANDS,true,true,this,"playerLands"),
		};
		
		
	}
	
	reset(){
		this.life = 20;
		for(let pile of this.piles){
			pile.empty();
		}
		/*TODO.*/
	}
	
	get $(){
		let sel = `.playerSide[player='${this.player}']`;
		return $(sel);
	}
	
	syncLife(){
		if(this.lifeTimer){
			clearTimeout(this.lifeTimer);
		}
		this.lifeTimer = setTimeout(()=>{
			let value = this.lifeDisplay.find(".playerLife").val();
			this.setLife(value);
		},500);
	}
	
	setLife(value,oppAction){
		this.life = Number(value);
		
		if(!oppAction){
			dbClient.sendToOpponent({
				"action" : "Set Life",
				"value" : this.life,
				"player" : this.player,
			});
		}else{
			this.lifeDisplay.find(".playerLife").val(this.life);
		}
	}
	
	setName(name){
		this.lifeDisplay.find(".playerLifeLabel").text(name);
		piles[name] = piles[this.player];
		players[name] = this;
		this.$.attr("player",name);
		delete piles[this.player];
		delete players[this.player];
		this.player = name;
	}
	
	setUpField(){
		let output = TemplateEngine(fieldTemplate,{player:this.player});
		$("#fieldContainer").append(output);
	}
	
	draw(){
		this.piles.deck.topCard.moveTo(this.piles.hand);
	}
	
	render(){
		for(let i in this.piles){
			this.piles[i].render();
		}
	}
}