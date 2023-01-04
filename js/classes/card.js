class Card{
	
	constructor(cardData,player){
		//cardData from the scryfall api.
		this.cardData = cardData;//debugCardData;
		this.tapped = false;
		
		this.pile = undefined;
		this.player = player;
		
		this.face = 0;
		
		this.counters = {};
		this.counterTimers = {};
		
		this.generateUID();
		
	}
	
	generateUID(){
		this.uidNumber = this.player.cardUidCount++;
		this.uid = this.player.player+"-"+this.uidNumber
		cards[this.uid] = this;
	}
	
	get index(){
		return this.pile.cards.indexOf(this);
	}
	
	get visible(){
		return (
			this.pile.faceUp || //public location
			this.tapped ||  //tapped = revealed in hand
			(!this.pile.faceUp&&this.pile==activePile) || //pile being viewed
			//(scryPile&&scryPile.cards.indexOf(this)!=-1) //pile being scry'd
			this.scryPile //pile being scry'd
		);
	}
	
	
	getImage_uris(){
		return this.cardData.image_uris ? this.cardData.image_uris : this.cardData.card_faces[this.face].image_uris;
	}
	
	getImageType(type){
		try{
			if(this.visible){
				return this.getImage_uris()[type];
			}else{
				return './img/cardBack.png';
			}
		}catch(err){
			return './img/cardBack.png'; 
		}
	}
	
	get image(){
		return this.getImageType("small");
	}
	
	get largeImage(){
		return this.getImageType("large");
	}
	
	flip(){
		this.face = this.face==1?0:1;
		this.pile.render();
		
		dbClient.sendToOpponent({
			"action" : "Flip",
			"uid" : this.uid,
			"face" : this.face,
		});
		
	}
	
	addCounter(){
		this.incrementCounter(1);
	}
	
	removeCounter(){
		this.incrementCounter(-1)
	}
	
	incrementCounter(inc){
		if(this.pile.spread && this.pile.type!=PILE_HAND){
			this.counters[actionParam] = this.counters[actionParam]?this.counters[actionParam]:0;
			this.counters[actionParam]+=inc;
			this.syncCounters(actionParam);
			this.pile.render();
		}
	}
	
	syncCounters(counterColourRaw){
		counterColour = counterColourRaw.toLowerCase();
		if(this.counterTimers[counterColour]){
			clearTimeout(this.counterTimers[counterColour]);
		}
		this.counterTimers[counterColour] = setTimeout(()=>{
			this.sendCounters(counterColour)
		},500);
	}
	
	sendCounters(counterColour){
		dbClient.sendToOpponent({
			"action" : "Counters",
			"uid" : this.uid,
			"colour" : counterColour,
			"counters" : this.counters[counterColour],
		});
	}
	
	
	
	clone(oppAction){
		this.pile.addCard(clone(this.cardData));
		this.pile.render();		
		
		if(!oppAction){
			dbClient.sendToOpponent({
				"action" : "Clone",
				"uid" : this.uid,
			});
		}
	}
	
	destroy(oppAction){
		this.pile.removeCard(this);
		this.pile.render();	
		
		if(!oppAction){
			dbClient.sendToOpponent({
				"action" : "Destroy",
				"uid" : this.uid,
			});
		}
	}
	
	moveTo(pile,oppAction,toTop){
		this.tapped = false;
		
		if(!pile.spread || pile.type == PILE_HAND){
			this.counters = {};
		}
		
		this.oldPile = this.pile;
		
		if(this.pile && this.pile==loadPile){
			this.player = pile.player;
			this.generateUID();
			
			let oldIndex = this.pile.cards.indexOf(this);
			this.pile.cards[oldIndex] = new Card(clone(this.cardData),this.pile.player)
			this.pile.cards[oldIndex].pile = this.pile;
			//this.pile.addCard(clone(this.cardData));
		}
		
		if(this.pile){
			this.pile.removeCard(this);
			this.pile.render();
		}

		if(!oppAction){
			toTop = (pile.type==PILE_DECK)?$("#topDeckCheckbox").prop("checked"):false;
		}
		
		pile.addCard(this,toTop);
		this.pile.render();
		
		if(this.scryPile){
			this.scryPile.removeCard(this);
			this.scryPile.render();
			delete this.scryPile;
		}
		
		if(!oppAction){
			dbClient.sendToOpponent({
				"action" : "Move To",
				"uid" : this.uid,
				"pile" : pile.type,
				"player" : pile.player.player,
				"toTop" : toTop,
				"id" : this.oldPile==loadPile?this.cardData.id:undefined,//incase we need to load the card data in.
			});
		}
		
	}
	
	toggleTapped(){
		this.tapped = !this.tapped;
		this.pile.render();
		
		
		dbClient.sendToOpponent({
			"action" : "Tapped",
			"uid" : this.uid,
			"tapped" : this.tapped,
		});
		
		
	}
	
	click(event){
		if(this[activeAction]){
			this[activeAction]();
		}else if(this.pile[activeAction]){
			this.pile[activeAction]();
		}
	}
	
	auxClick(event){
console.log(event.button);
		if (event.button == 1) {//middle click
			this.toggleTapped();
		}else if (event.button == 2) {//right click
			this.pile.viewPile();
		}
	}
	
	loadCard(cb){
		let headers = {
			"Content-Type" : "application/json",
		}
		doRequest("https://api.scryfall.com/cards/"+this.cardData.id,"GET",{},headers,(resp)=>{
			this.cardData = JSON.parse(resp);
			this.pile.render();
			if(cb){
				cb();
			}
		});
	}
	
	keywordIcons(){//leave for now - doesnt look good.
		let iconList = {
			"Flying" : {icon : "kiwi-bird", colour: "#f7f7f7"},
			"Deathtouch" : {icon : "skull", colour: "#000000"},
			"Haste" : {icon : "fast-forward", colour: "#bb5555"},
		}
		
		let icons = this.cardData.keywords.map((e)=>{
			return iconList[e];
		}).filter((e)=>{
			return !!e;
		});
		
		return TemplateEngine(iconsTemplate,{icons:icons});
	}
	
}