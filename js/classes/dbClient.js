class DBClient{

	constructor(username,password){
		this.version = 676;
		
		this.heartBeatInterval = 30000;
		this.msgQueueInterval = 300;
		
		this.maxMsgSize = 500;
		
		this.log = [];
		
		this.username = username;
		this.rawPassword = password;
		this.msgQueue = [];
		
		this.login();
		/*
		if(username && password){
			this.login();
		}else{
			this.db_id = localStorage.getItem("db_id");
			this.relogin();
		}*/
	}
	
	relogin(){//cant use this due to unsafe header.
		let payload = { 
			db_id: this.db_id,
			version:this.version,
		};
		let formData= new URLSearchParams(payload).toString();
		let headers = {"Content-Type": "application/x-www-form-urlencoded"};
		doRequest("https://www.duelingbook.com/logged-in.php","POST",formData,headers,(resp)=>{
			//localStorage.setItem("login",resp);
			this.processLogin(JSON.parse(resp));
		});
	}

	login(){
		/*
		if(localStorage.getItem("login")){
			this.processLogin();
			return;
		}*/
		
		let payload = { 
				username: this.username,
				password: this.rawPassword, 
				remember_me:1,
		};
		
		let formData= new URLSearchParams(payload).toString();
		
		let headers = {"Content-Type": "application/x-www-form-urlencoded"};
		
		doRequest("https://www.duelingbook.com/php-scripts/login-user.php","POST",formData,headers,(resp)=>{
			//localStorage.setItem("login",resp);
			this.processLogin(JSON.parse(resp));
		});
	}
	
	processLogin(data){
		//let data =JSON.parse(localStorage.getItem("login"));//JSON.parse(resp);
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
		//$('label[for="player2Life"]').text(this.username);
		
		this.connect();
	}
	
	
	send(data){
		this.lastSend = new Date();
		this.socket.send(JSON.stringify(data));
	}
	
	//may need to add to a queue to prevent too many going at once here.
	sendToOpponent(data){
console.log("sendToOpponent",data);

		let message = {
			action:"Private message",
			message:JSON.stringify(data), 
			username:this.opponent
		};
		
		if(true){ // maybe allow instant message every X?
			this.msgQueue.push(data);
		}else{
			this.send(message);
		}
	}
	
	sendQueue(){
		if(this.msgQueue.length){
			
			let message = {
				action:"Private message",
				message:"", 
				username:this.opponent
			};
			
			let msgIndex;
			
			for(let i=0;i<this.msgQueue.length;i++){
				message.message = JSON.stringify(this.msgQueue.slice(0,i+1));
				if(message.message.length > this.maxMsgSize){
					break;
				}else{
					msgIndex = i;
				}
			}
			message.message = JSON.stringify(this.msgQueue.slice(0,msgIndex+1));
			this.msgQueue.splice(0,msgIndex+1);
			this.send(message);
		}
	}
	
	
	
	keepAlive(){
		this.send({"action":"Heartbeat"});
	}
	
	connect(){
		
		this.socket =  new WebSocket("wss://duel.duelingbook.com:8443/");
		
		this.socket.addEventListener('message', (event) => {
			this.onData(JSON.parse(event.data));
		});
		this.socket.onopen = (event)=>{
			console.log(event);
			setInterval(()=>{this.keepAlive()},this.heartBeatInterval);
			setInterval(()=>{this.sendQueue()},this.msgQueueInterval);
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
	
	connectOpponent(opponent){
		this.opponent = opponent;
		player1.setName(opponent);
		//$('label[for="player1Life"]').text(opponent);
		this.sendToOpponent({
			action : "Start Game",
			deck : player2.rawTxtDecklist,
		});
		
	}

	onData(msg){
	//	console.log(msg);

		
		//do whatever here :)
		if(msg.action == "Connected"){
			console.log("Connected");
			
			$("#loginForm").hide();
			$("#deckInput").show();
			
		}else if(msg.action == "Lost connection"){
			console.log("Lost Connection");
		}else if(msg.action == "Private message"){
			
			let allData = JSON.parse(msg.message);
			let sender = msg.username;
			for(let data of allData){
				this.onMtgMsg(data,sender);
			}
		}
		
	}
	
	onMtgMsg(data,sender){
		console.log(sender,data);
			//let data = JSON.parse(msg.message);
			//let sender = msg.username;
			//send these to the "real" event handler, if the username matches the player we are playing.
			
			if(data.action=="Start Game"&&sender!=this.username&&!this.opponent){
				this.connectOpponent(sender);//send them our decklist
			}
			
			if(sender==this.opponent){
				if(data.action=="Start Game"){
					processDeckList(data.deck,player1);
					$("#opponentForm").hide();
				}else if(data.action=="Move To"){
					let card = cards[data.uid];
					let pile = piles[data.player][data.pile];
					let toTop =data.toTop;
					let id =data.id;
					
					if(!card){
						card = new Card({id:id},pile.player);
						card.loadCard();
					}
					
					card.moveTo(pile,true,toTop);
				}else if(data.action=="Clone"){
					let card = cards[data.uid];
					card.clone(true);
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
	
}