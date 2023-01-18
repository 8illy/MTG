class Replay extends DBClient{
	
	constructor(replayData){
		super();
		
		this.gameLog = replayData;
		this.pointer = 0;
		
		let playerNames = replayData.map((e)=>{return e.sender}).filter(filterUnique);
		this.opponent = playerNames[0];
		this.username = playerNames[1];
		
		player1.setName(this.opponent);
		player2.setName(this.username);
		
		$("#boardContainer").show();
		$("#loginForm").hide();
		
		$('[tabContent="#gameControls"]').hide();
		$('[tabContent="#replaySidebarBox"]').show();
		
		$(".playerLife").prop("readonly",true)
		$(".resetDeckBtn").hide();
		
		this.timer = false;
		this.timerInterval = 1000;//1 action per second.
		
		this.start();
		
	}
	
	toggleTimer(){
		if(this.timer){
			this.stopTimer()
		}else{
			this.startTimer();
		}
	}
	
	refreshTimer(){
		if(this.timer){
			this.stopTimer();
			this.startTimer();
		}
	}
	
	stopTimer(){
		clearInterval(this.timer);
		this.timer = false;
	}
	
	startTimer(){
		this.timer = setInterval(()=>{
			this.next()
		},this.timerInterval);
	}
	
	start(){
		while(true){
			let step = this.gameLog[this.pointer];
			if(step.data.action=="Start Game"){
				this.next();
			}else{
				break;
			}
		}
	}
	
	next(){
		
		let step = this.gameLog[this.pointer++];
		//todo - logic to skip over certain actions
		if(step){
			this.onMtgMsg(step.data,step.sender);
			this.onMtgMsgLog(step.data,step.sender);
		}else{
			this.stopTimer();
		}
			
	}
	
}