function dragCard(ev) {
	let uid  = ev.target.getAttribute("uid");
	ev.dataTransfer.setData("selectedCard", uid);
}

function chunk (arr, len) {

  var chunks = [],
      i = 0,
      n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
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
		//rawDeckList = fr.result; // bad change this later :)
		processDeckList(fr.result,player2);
		
		$("#opponentForm").show();
		$("#boardContainer").show();
	}
          
	fr.readAsText(deckFile);
}


function processDeckList(rawTxt,ownerPlayer){
	//ownerPlayer.rawTxtDecklist = rawTxt;//outdated, as will change this for commander
	
	let lines = rawTxt.split("\r\n");
	lines = lines.filter(function(e){return !!e.trim()});
	//for now ignore sideboard
	let sideboardIndex = lines.findIndex(function(a){return a.match(/sideboard/gi)});
console.log(sideboardIndex);
	if(sideboardIndex!=-1){
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
	
	ownerPlayer.originalDeckList = lines;
	
	ownerPlayer.piles.deck.loadCards(lines,()=>{ownerPlayer.render();});
}


function previewCard(card,forceVisible){
	if(card.visible||forceVisible){
		//let output = TemplateEngine(cardPreviewTemplate,card);
		//$("#cardPreviewContainer").html(output);
		$("#largeCardImg").width($("#largeCardImg").width());
		$("#largeCardImg").attr("src",card.largeImage)
	}
}

function setAction(a,elem){
	activeAction = activeAction==a?undefined:a;
	$(".activeAction").removeClass("activeAction");
	if(activeAction){
		$(elem).addClass("activeAction");
	}
}

function setActionParam(promptText,a){
	if(activeAction==a){
		actionParam = prompt(promptText);
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
			cardUidCount : 1,
		});
		let respData = JSON.parse(resp).data;
		for(let cardData of respData){
			loadPile.addCard(cardData);
		}
		loadPile.viewPile();
	});
}


function getCardIndex(a,player){
	return (e)=>{
		let uid = e;
		if(uid<0){
			uid = uid*-1;
		}
		return uid==a.uidNumber && ( (e<0 && a.player!=player)||(e>0 && a.player==player));
	}
}


function highlight(str,colour,action){
	colour=colour?colour:"red";
	return TemplateEngine(`<span style="color:${colour}" onmouseover="${action}"><%this%></span>`,str);
}