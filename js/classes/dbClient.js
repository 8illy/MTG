class DBClient{

	constructor(username,password){
		this.username = username;
		this.rawPassword = password;
		
		this.login();
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
			let data = JSON.parse(resp);
			if(data.message =="Invalid password"){
				//todo;
				alert("Invalid Password");
				return;
			}
			this.password = data.password;
			this.connect();
		});
	}
	
	send(data){
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
		
		//this.messageQueue.push(message);

		this.send(message);
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
			setInterval(()=>{this.keepAlive()},30000);
			this.send({
				"action": "Connect",
				"username": this.username,
				"password": this.password,
				"db_id": "",
				"session": "",
				"administrate": false,
				"version": 676,
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
		$('label[for="player1Life"]').text(opponent);
		this.sendToOpponent({
			action : "Start Game",
			deck : rawDeckList,
		});
		
	}

	onData(msg){
	//	console.log(msg);
		
		if(msg.action=="Multiple"){
			//todo - allow bundeling multiple actions in one go.
			return;
		}
		
		//do whatever here :)
		if(msg.action == "Connected"){
			console.log("Connected");
		}else if(msg.action == "Lost connection"){
			console.log("Lost Connection");
		}else if(msg.action == "Private message"){
console.log("onData",msg);			
			let data = JSON.parse(msg.message);
			let sender = msg.username;
			//send these to the "real" event handler, if the username matches the player we are playing.
			
			if(data.action=="Start Game"&&sender!=this.username&&!this.opponent){
				this.connectOpponent(sender);//send them our decklist
			}
			
			if(sender==this.opponent){
				if(data.action=="Start Game"){
					processDeckList(data.deck,player1);
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
				}
			}
			
			
			
		}
		
	}
	
}