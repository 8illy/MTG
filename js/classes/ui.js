class UI{
	
	constructor(){
		//todo - this will handle all dom calls.
		//also need to use to decide if safe to hide loading animations
		this.loadingCount = 0;
		this.activeAction = undefined;
		this.actionParam = undefined;
		
		this.largeCardImg = $("#largeCardImg");
		this.logOutputContainer = $("#logOutput");
		this.loginForm = $("#loginForm");
		this.boardContainer = $("#boardContainer");
		this.fieldContainer = $("#fieldContainer");
		this.userLoginSelector = $("#dbUserSelector");
		
		this.loginFormUser = $("#dbUser");
		this.loginFormPass = $("#dbPass");
		this.opponentInput = $("#dbOpponent");
		
		this.p1LifeDisplay = $('#player1LifeDisplay');
		this.p2LifeDisplay = $('#player2LifeDisplay');
		this.loadingContainer = $("#loadingContainer");
		
		this.topDeckCheckbox = $("#topDeckCheckbox");
		this.scryShowOpponentCheckbox = $("#scryOpponent");
		
		this.viewPileContainer = $("#viewPileContainer");
				
	}
	
	//ui
	
	previewCard(card,forceVisible){
		if(card.visible||forceVisible){
			this.largeCardImg.width(this.largeCardImg.width());
			this.largeCardImg.attr("src",card.largeImage)
		}
	}
	
	addLog(log){
		this.logOutputContainer.prepend(TemplateEngine(logTemplate,log));
	}
	
	enableReplayMode(){
		this.boardContainer.show();
		this.loginForm.hide();
		
		$('[tabContent="#gameControls"]').hide();
		$('[tabContent="#replaySidebarBox"]').show();
		
		$(".playerLife").prop("readonly",true)
		$(".resetDeckBtn").hide();
	}
	
	prepareLoginScreen(){
		let loginData = localStorage.getItem("loginData")
		if(loginData){
			loginData = JSON.parse(loginData);
			for(let i in loginData){
				this.userLoginSelector.append(`<option value="${i}">${i}</option>`);
			}
			this.userLoginSelector.change(()=>{
				let val = this.userLoginSelector.val();
				if(val){
					this.loginFormUser.val(val);
					this.loginFormPass.val(loginData[val]);
					game.login();
				}
			});
		}else{
			this.userLoginSelector.hide();
		}
		
		$("#sidebarBoxTabStrip > .sidebarBoxTabStripItem").click(function(){
			let selClass="sidebarBoxTabStripItemSelected";
			$("."+selClass).removeClass(selClass);
			$(this).addClass(selClass);
			
			let selBoxClass="sidebarBoxSelected";
			$("."+selBoxClass).removeClass(selBoxClass);
			$($(this).attr("tabContent")).addClass(selBoxClass);
		});
	
		$("#sidebarBoxTabStrip > .sidebarBoxTabStripItem").eq(0).click();
	}
	
	host(){
		dbClient.connectOpponent(this.opponent);
	}

	login(){

		setup();
		
		dbClient = new DBClient(this.username,this.password);
	}
	
	get toTopDeck(){
		return this.topDeckCheckbox.prop("checked");
	}
	
	get scryShowOpponent(){
		return this.scryShowOpponentCheckbox.prop("checked");
	}
	
	get username(){
		return this.loginFormUser.val();
	}	
	
	get opponent(){
		return this.opponentInput.val();
	}	
	
	get password(){
		return this.loginFormPass.val();
	}
	
	setAction(a,elem){
		this.activeAction = this.activeAction==a?undefined:a;
		$(".activeAction").removeClass("activeAction");
		if(this.activeAction){
			$(elem).addClass("activeAction");
			$("[tabContent='#gameControls'] > .fa").show();
		}else{
			$("[tabContent='#gameControls'] > .fa").hide();
		}
	}

	setActionParam(promptText,a){
		if(this.activeAction==a){
			this.actionParam = prompt(promptText);
		}
	}
	
	//loading screens
	loading(){
		this.loadingContainer.show();
		this.loadingCount+=1;
	}
	
	loadingPartDone(){
		this.loadingCount-=1;
		if(!this.loadingCount){
			this.loadingFinished();
		}
	}
	
	loadingFinished(){
		this.loadingContainer.hide();
	}
	
	//field setup
	addField(playerName){
		let output = TemplateEngine(fieldTemplate,{player:playerName});
		this.fieldContainer.append(output);
	}
	
	renderViewPile(pile){
		let output = TemplateEngine(viewPileTemplate,pile);
		this.viewPileContainer.html(output);
		
		this.viewPileContainer.off('drop').on('dragover', false).on('drop',(ev)=>{	
			let uid = ev.originalEvent.dataTransfer.getData("selectedCard");
			let card = game.cards[uid];
			pile.handleDrop(card);
			return false;
		});
		
	}
	
	
}