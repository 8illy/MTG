function dragCard(ev) {
	let uid  = ev.target.getAttribute("uid");
	ev.dataTransfer.setData("selectedCard", uid);
}


function doRequest(url,method="GET",payload={},headers={},callback=console.log){
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			callback(this.responseText);
		}
	};
	xhr.open(method, url, true);
	for(let i in headers){
		xhr.setRequestHeader(i, headers[i]);
	}
	xhr.send(payload);
}

function TemplateEngine(template, options) {
	
	let re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
	let add = function(line, js) {
		js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
			(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
		return add;
	}
	while(match = re.exec(template)) {
		add(template.slice(cursor, match.index))(match[1], true);
		cursor = match.index + match[0].length;
	}
	add(template.substr(cursor, template.length - cursor));
	code += 'return r.join("");';
	return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}

function shuffle(array,start,end) {
	
	start = start?start:0;
	start = Math.max(0,start);
	
	end = end?end:array.length
	end = Math.min(array.length,end);
	
	let currentIndex = end;//array.length;
	let temporaryValue;
	let randomIndex;

	// While there remain elements to shuffle...
	while (start !== currentIndex) {

		// Pick a remaining element...
		randomIndex = start + (Math.floor(Math.random() * (end - start)));
		currentIndex -= 1;
		
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

  return array;
}

function importDeck(deckFile){
	$("#deckInput").hide();
	
	//read the file.
	let fr=new FileReader();
            
	fr.onload= ()=>{
		rawDeckList = fr.result; // bad change this later :)
		processDeckList(fr.result,player2);
	}
          
	fr.readAsText(deckFile);
}


function processDeckList(rawTxt,ownerPlayer){
	
	
	
	let lines = rawTxt.split("\r\n");
	lines = lines.filter(function(e){return !!e.trim()});
	//for now ignore sideboard
	if(lines.indexOf("SIDEBOARD:")){
		lines = lines.slice(0,lines.indexOf("SIDEBOARD:"));
	}

	//get quantities & card names
	lines = lines.map(function(e){
		let parts = e.split(" ");
		return {
			quantity : Number(parts.shift()),
			name : parts.join(" "),	
		}
	});
	
	//build the request for scryfall
	
	let payload = JSON.stringify({
		"identifiers": lines,
	});
	
	let headers = {
		"Content-Type" : "application/json",
	}
	
	doRequest("https://api.scryfall.com/cards/collection","POST",payload,headers,function(resp){
		createDeck(resp,lines,ownerPlayer);
	});
	
}

function createDeck(resp,decklist,ownerPlayer){
	let allCardData = JSON.parse(resp).data;

	for(let card of decklist){
		let cardData = allCardData.find(function(e){return e.name ==card.name});
		for(let i = 0;i<card.quantity;i++){
			ownerPlayer.piles.deck.addCard(cardData);
		}
	}
	ownerPlayer.render();
}

function previewCard(card){
	if(card.visible){
		let output = TemplateEngine(cardPreviewTemplate,card);
		$("#cardPreviewContainer").html(output);
	}
}

function setAction(a,elem){
	activeAction = activeAction==a?undefined:a;
	$(".activeAction").removeClass("activeAction");
	if(activeAction){
		$(elem).addClass("activeAction");
	}
}

function handRotation(card){
	let cards = card.pile.cards;
	let items = cards.length;
	let index = cards.indexOf(card);
	
	let max = 30;
	let slice = Math.floor((max*2 / items)/5)*5;
	let rotation = 0;
	let center = (items/2)-1;
	if(center==Math.ceil(center)){
		center+=0.5;
	}
	center = Math.ceil(center);
	//check if we are above or below the center
	rotation = (index-center) * slice; 
	
	
	return "";
	return `rotate:${rotation}deg;margin-bottom:-${ Math.abs(index-center)*10}px;`;
}

function startingHands(){
	for(var i=0;i<7;i++){player2.draw();player1.draw();}
}

function closeModal(){
	$("#pileDisplayModal").modal("hide");
	let oldActivePile = activePile;
	if(scryPile){
		scryPile.empty();
		scryPile.parentPile.render();
		delete scryPile;
	}
	activePile = undefined;
	oldActivePile.render();
}

function clone(arr){
	return JSON.parse(JSON.stringify(arr));
}

function loadNewCards(search){
	let headers = {
		"Content-Type" : "application/json",
	}
	
	search = search?search:prompt("Search");
	
	doRequest("https://api.scryfall.com/cards/search?order=cmc&q="+encodeURIComponent(search),"GET",{},headers,function(resp){
		loadPile = new Pile();
		piles["loadNewCards"] = {};
		loadPile.setPlayer({
			player : "loadNewCards",
			cardUidCount : 0,
		});
		let respData = JSON.parse(resp).data;
		for(let cardData of respData){
			loadPile.addCard(cardData);
		}
		loadPile.viewPile();
	});
}