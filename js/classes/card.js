class Card{
	
	constructor(cardData,player){
		//cardData from the scryfall api.
		this.cardData = cardData;//debugCardData;
		this.tapped = false;
		
		this.pile = undefined;
		this.player = player;
		
		this.face = 0;
		
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
	
	moveTo(pile,oppAction,toTop){
		this.tapped = false;
		
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
				"pile" : pile.pileClass,
				"player" : pile.player.player,
				"toTop" : toTop,
				"id" : this.cardData.id,//incase we need to load the card data in.
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
		if(activeAction=="flip"){
			this.flip();
		}else if(activeAction){
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
	
	loadCard(){
		let headers = {
			"Content-Type" : "application/json",
		}
		doRequest("https://api.scryfall.com/cards/"+this.cardData.id,"GET",{},headers,(resp)=>{
			this.cardData = JSON.parse(resp);
			this.pile.render();
		});
	}
	
}