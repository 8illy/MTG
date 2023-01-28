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
		game.cards[this.uid] = this;
	}
	
	get index(){
		return this.pile.cards.indexOf(this);
	}
	
	get visible(){
		return (
			this.pile.faceUp || //public location
			this.tapped ||  //tapped = revealed in hand
			(!this.pile.faceUp&&this.pile==game.activePile) || //pile being viewed
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
		
		game.dbClient.sendToOpponent({
			"action" : "Flip",
			"uid" : this.uid,
			"face" : this.face,
		});
		
	}
	
	addCounter(counter){
		counter = counter?counter:game.ui.actionParam;
		this.incrementCounter(counter,1);
	}
	
	removeCounter(counter){
		counter = counter?counter:game.ui.actionParam;
		this.incrementCounter(counter,-1)
	}
	
	incrementCounter(counter,inc){
		if(this.pile.spread && this.pile.type!=PILE_HAND){
			this.counters[counter] = this.counters[counter]?this.counters[counter]:0;
			this.counters[counter]+=inc;
			this.syncCounters(game.ui.actionParam);
			this.pile.render();
		}
	}
	
	syncCounters(counterColourRaw){
		let counterColour = counterColourRaw.toLowerCase();
		if(this.counterTimers[counterColour]){
			clearTimeout(this.counterTimers[counterColour]);
		}
		this.counterTimers[counterColour] = setTimeout(()=>{
			this.sendCounters(counterColour)
		},500);
	}
	
	sendCounters(counterColour){
		game.dbClient.sendToOpponent({
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
			game.dbClient.sendToOpponent({
				"action" : "Clone",
				"uid" : this.uid,
			});
		}
	}
	
	destroy(oppAction){
		this.pile.removeCard(this);
		this.pile.render();	
		
		if(!oppAction){
			game.dbClient.sendToOpponent({
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
		
		if(!pile.spread){
			this.face = 0;//reset to "default" if exiled/gy/deck/hand
		}
		
		this.oldPile = this.pile;
		
		if(this.pile && this.pile==game.loadPile){
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
			toTop = (pile.type==PILE_DECK)?game.ui.toTopDeck:false;
		}
		
		pile.addCard(this,toTop);
		
		this.pile.render();
		
		if(this.scryPile){
			this.scryPile.removeCard(this);
			this.scryPile.render();
			delete this.scryPile;
		}
		
		if(!oppAction){
						
			game.dbClient.sendToOpponent({
				"action" : "Move To",
				"uid" : this.uid,
				"pile" : pile.type,
				"player" : pile.player.player,
				"toTop" : toTop,
				"id" : this.oldPile==game.loadPile?this.cardData.id:undefined,//incase we need to load the card data in.
			});
		}
		
	}
	
	toggleTapped(){
		this.tapped = !this.tapped;
		this.pile.render();
		
		
		game.dbClient.sendToOpponent({
			"action" : "Tapped",
			"uid" : this.uid,
			"tapped" : this.tapped,
		});
		
		
	}
	
	click(event){
		if(this[game.ui.activeAction]){
			this[game.ui.activeAction]();
		}else if(this.pile[game.ui.activeAction]){
			this.pile[game.ui.activeAction]();
		}
	}
	
	auxClick(event){
		if (event.button == 1) {//middle click
			if(!game.isReplay){
				this.toggleTapped();
			}
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
		
}