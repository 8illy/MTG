class UI{
	
	constructor(){
			//todo - this will handle all dom calls.
			//also need to use to decide if safe to hide loading animations
			this.loadingCount = 0;
			this.activeAction = undefined;
			this.actionParam = undefined;
	}
	
	//ui
	
	previewCard(card,forceVisible){
		if(card.visible||forceVisible){
			$("#largeCardImg").width($("#largeCardImg").width());
			$("#largeCardImg").attr("src",card.largeImage)
		}
	}
	
	prepareLoginScreen(){
		let loginData = localStorage.getItem("loginData")
		if(loginData){
			let dbUserSelector = $("#dbUserSelector");
			loginData = JSON.parse(loginData);
			for(let i in loginData){
				dbUserSelector.append(`<option value="${i}">${i}</option>`);
			}
			$("#dbUserSelector").change(function(){
				if($(this).val()){
					$("#dbUser").val($(this).val());
					$("#dbPass").val(loginData[$(this).val()]);
					game.login();
				}
			});
		}else{
			$("#dbUserSelector").hide();
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
		let username = $("#dbOpponent").val();
		dbClient.connectOpponent(username);
	}

	login(){
		let username = $("#dbUser").val();
		let password = $("#dbPass").val();
		
		setup();
		
		dbClient = new DBClient(username,password);
	}
	
	//ui actions
	get p1LifeDisplay(){
		return $('#player1LifeDisplay');
	}
	
	get p2LifeDisplay(){
		return $('#player2LifeDisplay');
	}
	
	get toTopDeck(){
		return $("#topDeckCheckbox").prop("checked");
	}
	
	get username(){
		return $("#dbUser").val();
	}	
	
	get opponent(){
		return $("#dbOpponent").val();
	}	
	
	get password(){
		return $("#dbPass").val();
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
		$("#loadingContainer").show();
		this.loadingCount+=1;
	}
	
	loadingPartDone(){
		this.loadingCount-=1;
		if(!this.loadingCount){
			this.loadingFinished();
		}
	}
	
	loadingFinished(){
		$("#loadingContainer").hide();
	}
	
	//field setup
	addField(playerName){
		let output = TemplateEngine(fieldTemplate,{player:playerName});
		$("#fieldContainer").append(output);
	}
	
	
}