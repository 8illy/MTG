class Pile{
	
	constructor(type=PILE_GENERIC,faceUp=false,spread=false,player){
		this.faceUp = faceUp;
		this.spread = spread;
		this.type = type;//PILE_DECK
		this.cards = [];
		this.player = player;
		this.pileClass = "player"+this.type;

		if(this.player){
			piles[this.player.player][this.type] = this;
			
			this.addDropEvent();
		}
		
	}
	
	setPlayer(player){
		console.log(player);
		this.player = player;
		piles[this.player.player][this.type?this.type:"generic"] = this;
	}
	
	get $(){
		
		let sel = `.playerSide[player='${this.player.player}'] .${this.pileClass}`;

		return $(sel);
	}
	
	get topCard(){
		return this.cards[0];
	}
		
	addCard(input,toTop){
		//input can be an existing card, or a card id
		//if it is a card id need to create a new card.
		//by default add to the bottom (highest index)
		let card = this.getOrCreateCard(input);
		let index;
		if(toTop){
			this.cards.unshift(card);
			index = 0;
		}else{
			index = this.cards.push(card);
		}
				
		card.pile = this;
		
		return card;
	}
	
	
	//cardsToLoad = [{name:name,quantity:quantity},]
	loadCards(cardsToLoad,cb){
		
		let apiCardLimit = 75;
		
		if(cardsToLoad.length <=apiCardLimit){
			this.loadCardsFromAPI(cardsToLoad,cb);
		}else{
			let cardLists = chunk(cardsToLoad,apiCardLimit);
			let promises = [];
			for(let i in cardLists){
				let pr = $.Deferred();
				promises.push(pr);
				this.loadCardsFromAPI(cardLists[i],()=>{pr.resolve();});
			}
			$.when(...promises).then( cb );
		}
	}
	
	loadCardsFromAPI(cardsToLoad,cb){
		let payload = JSON.stringify({
			"identifiers": cardsToLoad,
		});
	
		let headers = {
			"Content-Type" : "application/json",
		}
		
		doRequest("https://api.scryfall.com/cards/collection","POST",payload,headers,(resp)=>{
			let allCardData = JSON.parse(resp).data;
			
			for(let card of cardsToLoad){
				let cardData = allCardData.find((e)=>{return e.name ==card.name});
				for(let i = 0;i<card.quantity;i++){
					this.addCard(cardData);
				}
			}
			
			if(cb){
				cb();
			}
			
		});
	}
	
	
	
	getOrCreateCard(input){
		//card id or card object to card object
		if(input instanceof Card){
			return input;
		}else{
			return new Card(input,this.player);
		}
	}
	
	getExistingCard(index){
		//card index or card object to card object
		if(index instanceof Card){
			return index;
		}else{
			return this.cards[index];
		}
	}
	
	removeCard(input){
		//input can be an existing card, or an index
		let index = input;
		if(input instanceof Card){
			index = this.cards.indexOf(input);
		}
		if(index==-1){
			return undefined;
		}
		return this.cards.splice(index,1)[0];
	}
	
	moveCard(input,newIndex){
		//input can be an existing card, or an index		
		let card = getExistingCard(input);
		arr.splice(card.index, 1);
		arr.splice(newIndex, 0, card);
	}
	
	
	
	shuffle(){
		this.cards = shuffle(this.cards);
		let order = this.cards.map((e)=>{
			return e.player==this.player? e.uidNumber:-e.uidNumber;
		});
		
		//todo - if opps card is in hand send its uid as negative, and detect this in setshuffle.
		
		this.render();
		this.animateShuffle();
		dbClient.sendToOpponent({
			"action" : "Shuffle",
			"pile" : this.type,
			"player" : this.player.player,
			"order" : JSON.stringify(order),
		});
		
	}
	
	animateShuffle(){
		let elem = this.$.find(".cardImg");
		if(elem.length && (this.type==PILE_DECK ||this.type==PILE_HAND)){
			elem.css("transition-duration","0s").css("transform","rotate(0deg)");setTimeout(()=>{
				elem.css("transition-duration","1.5s").css("transform","rotate(360deg)");
			},0);
		}
	}
		
	setShuffle(order){
		this.cards.sort((a,b)=>{			
			let indexA = order.findIndex(getCardIndex(a,this.player));
			let indexB = order.findIndex(getCardIndex(b,this.player));
				
			return indexA-indexB;
		});
		this.render();
		this.animateShuffle();
	}
	
	untapAll(oppAction){
		for(let card of this.cards){
			card.tapped = false;
		}
		this.render();
		
		if(!oppAction){
			dbClient.sendToOpponent({
				"action" : "Untap All",
				"pile" : this.type,
				"player" : this.player.player,
			});
		}
	}
	
	empty(){
		for(let card of this.cards){
			if(card.scryPile==this){
				delete card.scryPile;
			}
			if(card.pile==this){
				delete card.pile;
			}
		}
		this.cards = [];
	}
	
	scry(num,oppAction){
		num = num?num:$("#scryNumber").val();
		if(num){
			let scryPile = new Pile(PILE_GENERIC,false,false,this.player);
			scryPile.cards = this.cards.slice(0,num);
			for(let card of scryPile.cards){
				card.scryPile = scryPile;
			}
			scryPile.viewPile();
			scryPile.parentPile = this;
			this.render();
		}
		
		if(!oppAction){
			dbClient.sendToOpponent({
				"action" : "Scry",
				"pile" : this.type,
				"player" : this.player.player,
				"number" : num,
				"reveal" : $("#scryOpponent").prop("checked"),
			});
		}
		
	}
	
	reveal(){
		dbClient.sendToOpponent({
			"action" : "Reveal",
			"pile" : this.type,
			"player" : this.player.player,
		});
	}
	
	handleDrop(card){
		card.moveTo(this);
	}
	
	addDropEvent(){		
	
		this.$.on('dragover', false).on('drop',(ev)=>{	
			let uid = ev.originalEvent.dataTransfer.getData("selectedCard");
			let card = cards[uid];
			this.handleDrop(card);
			return false;
		});
		
		
	}
	
	render(){
		if(this.player){
			let output = TemplateEngine(pileTemplate,this);
			this.$.html(output);
			this.resizeCardsIfOverflow();
		}
		if(activePile==this){
			this.renderViewPile();
		}
	}
	
	resizeCardsIfOverflow(){
		if(this.$.prop('scrollHeight') > this.$.height()){
			this.$.find(".pile").addClass("overflownPile");
		}else{
			this.$.find(".pile").removeClass("overflownPile");
		}
	}
	
	renderViewPile(){
		let output = TemplateEngine(viewPileTemplate,this);
		$("#viewPileContainer").html(output);
		
		$("#viewPileContainer").on('dragover', false).on('drop',(ev)=>{	
			let uid = ev.originalEvent.dataTransfer.getData("selectedCard");
			let card = cards[uid];
			this.handleDrop(card);
			return false;
		});
		
	}
	
	viewPile(){
		activePile = this;
		this.render();
		//$("#pileDisplayModal").modal("show");
		$("[tabContent='#pileSidebarBox']").click();
		$("[tabContent='#pileSidebarBox'] > .fa").show();
		$("#stopViewingBtn").show();
		let colour = this.player==player1?player2.colour:player1.colour;
		dbClient.sendToOpponent({
			"action" : "Log",
			"log" : `Viewed ${highlight(this.player.player,colour)}s ${highlight(this.type,"coral")}`,
		});
		
	}
	
	stopViewingPile(){
		$("[tabContent='#pileSidebarBox'] > .fa").hide();
		$("#stopViewingBtn").hide();
		activePile = undefined;
		$("#viewPileContainer").html("");
		if(this.type==PILE_GENERIC){
			this.empty();
			this.parentPile.render();
			//delete this;
		}else{
			this.render();
		}
		
		let colour = this.player==player1?player2.colour:player1.colour;
		dbClient.sendToOpponent({
			"action" : "Log",
			"log" : `Stopped Viewing ${highlight(this.player.player,colour)}s ${highlight(this.type,"coral")}`,
		});
	}
	
}