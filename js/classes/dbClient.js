class DBClient{

	constructor(username,password){
		this.version = 676;
		
		this.messageNumber = 0;
		
		this.heartBeatInterval = 30000;
		this.msgQueueInterval = 300;
		this.msgQueueLostTimeout = 1000; //change this timeout?
		
		this.maxMsgSize = 500;
		
		this.logItems = [];
		
		this.gameLog = [];//for building replays.
		
		this.username = username;
		this.rawPassword = password;
		
		
		this.msgQueue = [];//messages yet to be sent
		this.msgCache = {};//messages failed to sent, to be resent
		
		this.receivedMessagesToBeProcessed = {};//received messages, not yet processed.
		this.lastReceivedMessageID = 0;
		
		if(this.username && this.rawPassword){
			this.login();
		}
		
	}
	
	downloadReplay(){
		let str = JSON.stringify(this.gameLog);
		downloadFile("replay.mtg",str);
	}
	
	log(str,player){
		let log = {
			msg : str,
			player : player,
			time : new Date(),
		};
		
		this.logItems.push(log);
		
		$("#logOutput").prepend(TemplateEngine(logTemplate,log))

	}
	
	relogin(){//cant use this due to unsafe header.
		let payload = { 
			db_id: this.db_id,
			version:this.version,
		};
		let formData= new URLSearchParams(payload).toString();
		let headers = {"Content-Type": "application/x-www-form-urlencoded"};
		doRequest("https://www.duelingbook.com/logged-in.php","POST",formData,headers,(resp)=>{
			this.processLogin(JSON.parse(resp));
		});
	}

	login(){
	
		let payload = { 
				username: this.username,
				password: this.rawPassword, 
				remember_me:1,
		};
		
		let formData= new URLSearchParams(payload).toString();
		
		let headers = {"Content-Type": "application/x-www-form-urlencoded"};
		
		doRequest("https://www.duelingbook.com/php-scripts/login-user.php","POST",formData,headers,(resp)=>{
			this.processLogin(JSON.parse(resp));
		});
	}
	
	processLogin(data){
		if(data.message =="Invalid password"){
			//todo;
			alert("Invalid Password");
			return;
		}
		
		let loginData = localStorage.getItem("loginData");
		loginData=loginData?JSON.parse(loginData):{};
		loginData[this.username] = this.rawPassword;
		localStorage.setItem("loginData",JSON.stringify(loginData));
		
		
		
		localStorage.setItem("db_id",this.db_id);
		this.password = data.password;
		this.username = data.username;
		
		player2.setName(this.username);
		
		this.connect();
	}
	
	
	send(data){
		this.lastSend = new Date();
		this.socket.send(JSON.stringify(data));
	}
	
	sendToOpponent(data){

		let message = {
			action:"Private message",
			message:JSON.stringify(data), 
			username:this.opponent
		};
		
		if(this.opponent){ 
			this.msgQueue.push(data);
		}
	}
	
	sendQueue(){
		if(this.msgQueue.length){
			
			this.messageNumber++; //this is the problem (?)
			
			let message = {
				action:"Private message",
				message:"", 
				username:this.opponent
			};
			
			let msgIndex;
			
			for(let i=0;i<this.msgQueue.length;i++){
				message.message = JSON.stringify({
					data : this.msgQueue.slice(0,i+1),
					msgId : this.messageNumber,
				});
				if(message.message.length > this.maxMsgSize){
					break;
				}else{
					msgIndex = i;
				}
			}
			message.message = JSON.stringify({
				data : this.msgQueue.slice(0,msgIndex+1),
				msgId : this.messageNumber,
			});
			this.msgQueue.splice(0,msgIndex+1);
			
			this.msgCache[this.messageNumber] = {
				msgId : this.messageNumber,
				msg : message,
				time : new Date(),
			}
			
			this.send(message);
		}
	}
	
	
	
	keepAlive(){
		this.send({"action":"Heartbeat"});
	}
	
	connect(){
		
		this.socket =  new WebSocket("wss://duel.duelingbook.com:8443/");
		
		this.socket.addEventListener('message', (event) => {
			let valid = false;
			for(let msgId in this.receivedMessagesToBeProcessed){
				let msg = this.receivedMessagesToBeProcessed[msgId];
				valid = this.onData(msg);
				if(!valid){
					break;
				}
			}
			this.onData(JSON.parse(event.data));
		});
		this.socket.onopen = (event)=>{

			setInterval(()=>{this.keepAlive()},this.heartBeatInterval);
			setInterval(()=>{
				if(!this.queueLostMessages()){
					this.sendQueue();
				}
			},this.msgQueueInterval);

			this.send({
				"action": "Connect",
				"username": this.username,
				"password": this.password,
				"db_id": "",
				"session": "",
				"administrate": false,
				"version": this.version,
				"capabilities": "",
				"remember_me": 1,
				"connect_time": 0,
				"fingerprint": 0,
				"html_client": true,
				"mobile": false,
				"browser": "Chrome",
				"platform": "PC",
				"degenerate": false,
				"revamped": true
			});
		}
	}
	
	
	sendDeck(deckType){
		let deck = deckType==PILE_DECK?player2.originalDeckList:player2.originalSideDeckList;
		
		deck = deck.map((e)=>{
			return {
				q:e.quantity,
				n:e.name,
			}
		});
		
		let startGamePayload = {
			action : "Start Game",
			deckType : deckType,
			deck : "",
			count : 0,
			order : 0,
			hasSide : player2.originalSideDeckList.length>0,
		};
		
		let firstCardIndex = 0;
		let lastCardIndex = 0;
		
		let messages = [];
		let prev = "";
		//limit is 500 characters.
		for(let i=0;i<deck.length;i++){
			startGamePayload.deck = JSON.stringify(deck.slice(firstCardIndex,i+1));
			
			let dummyMsg = {
				data : JSON.stringify([startGamePayload]),
				msgId : this.messageNumber,
			}
			
			if(JSON.stringify(dummyMsg).length > this.maxMsgSize){
				firstCardIndex = i;
				messages.push(prev);
				
				if(i==deck.length-1){
					startGamePayload.deck = JSON.stringify(deck.slice(firstCardIndex,i+1));
					messages.push(startGamePayload);
				}
				
			}else if(i==deck.length-1){
				messages.push(startGamePayload);
			}else{
				prev = clone(startGamePayload)
			}
		}
		
		for(let i in messages){
			messages[i].order = i;
			messages[i].count = messages.length;
			this.sendToOpponent(messages[i]);
		}
		
	}
	
	connectOpponent(opponent){
		this.opponent = opponent;
		player1.setName(opponent);		
		
		$("#loadingContainer").show();
		
		this.sendDeck(PILE_DECK);
		this.sendDeck(PILE_SIDE);
		
	}

	confirmMessageSent(msgId){
		delete this.msgCache[msgId];
	}
	
	confirmMessageReceived(msgId){
		this.receivedMessages[msgId] = true;
	}
	
	queueLostMessages(){
		let msgsToSend = Object.values(this.msgCache);
		
		if(msgsToSend.length){
			if((msgsToSend[0].time.getTime() + this.msgQueueLostTimeout ) < new Date()){
				msgsToSend[0].time = new Date();
				this.send(msgsToSend[0].msg);
			}
			
		}
		
		return msgsToSend.length > 0;
	}

	processReceivedMessagesToBeProcessed(){
		
		for(let msg of this.receivedMessagesToBeProcessed){
			this.onData(msg);
		}
			
	}

	onData(msg){

		if(msg.action == "Connected"){
			
			$("#loginForm").hide();
			$("#deckInput").show();
			
		}else if(msg.action == "Lost connection"){
			console.log("Lost Connection");
		}else if(msg.action == "Private message"){

			let sender = msg.username;
			
			//for now just assume no one real will pm us.
			let allData = JSON.parse(msg.message);
			
			if(sender==this.username){				
				if(!this.msgCache[allData.msgId]){
					console.log("duplicate message sent",allData.msgId);
					return false;
				}else{
					console.log("confirm message sent",allData.msgId);
					this.confirmMessageSent(allData.msgId);
				}
			}
	

			if((!this.opponent ||sender==this.opponent )&& sender!=this.username && (this.lastReceivedMessageID + 1) != allData.msgId){

				if(allData.msgId <= this.lastReceivedMessageID){
					return false;
				}
				this.receivedMessagesToBeProcessed[allData.msgId] = msg;
				return false;
			}else{
				if(sender==this.opponent){
					delete this.receivedMessagesToBeProcessed[allData.msgId];
					this.lastReceivedMessageID = allData.msgId;
				}
				
				
				if(!this.opponent || (sender==this.opponent /*&& !this.receivedMessages[allData.msgId]*/) || sender==this.username){
					for(let data of allData.data){
						if(data.action=="Start Game"&&sender!=this.username&&!this.opponent){
							this.lastReceivedMessageID = allData.msgId;//fix for initial loading.
							this.connectOpponent(sender);//send them our decklist
						}
						
						if(sender==this.opponent){
							this.onMtgMsg(data,sender);
						}
						
						this.gameLog.push({data:data,sender:sender});//to build replays
						this.onMtgMsgLog(data,sender);
					}
					
				}
			
			}
			
			
			
			
				
				
			
		}
		return true;
	}
	
	onMtgMsgLog(data,sender){
		let senderPlayer = players[sender];
		let logMsg = "";
		
		let playerHighlight = data.player?players[data.player].colour:player2.colour;//;data.player==this.opponent?"red":"green";
		
		let cardHighlight = "blue";
		let locationHighlight = "coral";
		
		if(data.action=="Start Game"){
			logMsg = `Started the Game`
		}else if(data.action=="Move To"){
			let card = cards[data.uid];
			let vis = card.visible||(card.oldPile?card.oldPile.faceUp:false);
			if(card.cardData.name){
				logMsg = `Moved ${highlight(vis?card.cardData.name:"Unknown Card",cardHighlight,"previewCard(cards['"+card.uid+"'],"+vis+")")} to ${highlight(data.player,playerHighlight)}s ${highlight(data.pile,locationHighlight)} from ${highlight(card.oldPile?card.oldPile.type:"Generic",locationHighlight)}`;
			}
		}else if(data.action=="Clone"){
			let card = cards[data.uid];		
			logMsg = `Cloned ${highlight(card.player.player,card.player.colour)}s ${highlight(card.cardData.name,cardHighlight,"previewCard(cards['"+card.uid+"'],"+card.visible+")")}`;
		}else if(data.action=="Destroy"){
			let card = cards[data.uid];		
			logMsg = `Destroyed ${highlight(card.player.player,card.player.colour)}s ${highlight(card.cardData.name,cardHighlight,"previewCard(cards['"+card.uid+"'],"+card.visible+")")}`;
		}else if(data.action=="Shuffle"){
			logMsg = `Shuffled ${highlight(data.player,playerHighlight)}s ${highlight(data.pile,locationHighlight)}`;
		}else if(data.action=="Reveal"){
			let pile = piles[data.player][data.pile];			
			logMsg = `Revealed ${highlight(data.player,playerHighlight)}s ${highlight(data.pile,locationHighlight)}`;
		}else if(data.action=="Scry"){
			logMsg = `Scried ${highlight(data.player,playerHighlight)}s ${highlight(data.pile,locationHighlight)} for ${data.number}`;
		}else if(data.action=="Untap All"){
			logMsg = `Untapped All in ${highlight(data.player,playerHighlight)}s ${highlight(data.pile,locationHighlight)}`;
		}else if(data.action=="Tapped"){
			let card = cards[data.uid];
			logMsg = `${data.tapped?"Tapped":"Untapped"} ${highlight(card.player.player,card.player.colour)}s ${highlight(card.cardData.name,cardHighlight,"previewCard(cards['"+card.uid+"'],true)")} in ${highlight(card.pile.type,locationHighlight)}`;
		}else if(data.action=="Flip"){
			let card = cards[data.uid];
			if(card.visible){
				logMsg = `Flipped ${highlight(card.player.player,card.player.colour)}s ${highlight(card.cardData.name,cardHighlight,"previewCard(cards['"+card.uid+"'],true)")} in ${highlight(data.pile,locationHighlight)}`;
			}
		}else if(data.action=="Counters"){
			let card = cards[data.uid];
			logMsg = `Set ${highlight(card.player.player,card.player.colour)}s ${highlight(card.cardData.name,cardHighlight,"previewCard(cards['"+card.uid+"'],true)")} in ${highlight(card.pile.type,locationHighlight)} ${highlight("Counters",data.colour)} to ${data.counters}`;
			card.counters[data.colour] = data.counters;
			card.pile.render();
		}else if(data.action=="Set Life"){
			logMsg = `Set ${highlight(data.player,playerHighlight)}s Life to ${data.value}`;
		}else if(data.action=="Reset"){
			logMsg = `Reset ${highlight(data.player,playerHighlight)}s Deck`;
		}else if(data.action=="Log"){
			logMsg = data.log;
		}else if(data.action=="Coin"){
			logMsg = `Flipped a coin and Landed on ${highlight(data.result==1?"Heads":"Tails",locationHighlight)}`;
		}else if(data.action=="Dice"){
			logMsg = `Rolled a d${data.dice} and Landed on ${highlight(data.result,locationHighlight)}`;
		}
		
		if(logMsg){
			this.log(logMsg,senderPlayer);
		}
	}
	
	onMtgMsg(data,sender){
		let player = players[sender];
		if(data.action=="Start Game"){

			let lines = JSON.parse(data.deck).map((e)=>{
				return {
					name : e.n,
					quantity : e.q,
				}
			});
			
			if(data.deckType==PILE_DECK){
				//maindeck
				player.deckCache[data.order] = lines;
				player.deckCacheCount = data.count;
				if(Object.keys(player.deckCache).length == data.count){
					//player1.loadDeck();
					player.originalDeckList = [].concat(...player.deckCache);//todo.
				}						
			}else{
				//sidedeck
				player.sideDeckCache[data.order] = lines;
				player.sideDeckCacheCount = data.count;
				if(Object.keys(player.sideDeckCache).length == data.count){
					//player1.loadSideDeck();
					player.originalSideDeckList = [].concat(...player.sideDeckCache);//todo.
				}
			}
			
			if(player.originalDeckList.length && (player.originalSideDeckList.length || !data.hasSide)){
				player.loadDeck();
			}
			
			

			$("#opponentForm").hide();
		}else if(data.action=="Move To"){
			let card = cards[data.uid];
			let pile = piles[data.player][data.pile];
			let toTop =data.toTop;
			let id =data.id;
			
			if(!card){
				card = new Card({id:id},pile.player);
				card.loadCard(()=>{this.onMtgMsgLog(data,sender);});
			}
			
			card.moveTo(pile,true,toTop);
			
		}else if(data.action=="Clone"){
			let card = cards[data.uid];
			card.clone(true);
		}else if(data.action=="Destroy"){
			let card = cards[data.uid];
			card.destroy(true);
		}else if(data.action=="Shuffle"){
			let pile = piles[data.player][data.pile];
			pile.setShuffle(JSON.parse(data.order));	
			
		}else if(data.action=="Reveal"){
			let pile = piles[data.player][data.pile];
			pile.viewPile();
		}else if(data.action=="Scry"){
			let pile = piles[data.player][data.pile];
			let number = data.number;
			let reveal = data.reveal;
			//would log something here to say they have scry'd
			if(reveal){
				pile.scry(number,true);
			}
		}else if(data.action=="Untap All"){
			let pile = piles[data.player][data.pile];
			pile.untapAll(true);
		}else if(data.action=="Tapped"){
			let card = cards[data.uid];
			card.tapped = data.tapped;
			card.pile.render();
		}else if(data.action=="Flip"){
			let card = cards[data.uid];
			card.face = data.face;
			card.pile.render();
		}else if(data.action=="Counters"){
			let card = cards[data.uid];
			card.counters[data.colour] = data.counters;
			card.pile.render();
		}else if(data.action=="Set Life"){
			let player = players[data.player];
			let value = data.value;
			
			player.setLife(value,true);
			
		}else if(data.action=="Reset"){
			let player = players[data.player];
			player.reset(true);
		}

	}
	
}