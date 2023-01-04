const cardTemplate = `
	<div class="cardFrame" onmouseover="previewCard(cards['<%this.uid%>'])" onauxclick="cards['<%this.uid%>'].auxClick(event)" onclick="cards['<%this.uid%>'].click(event)" >
		
		<%TemplateEngine(countersTemplate,this)%>
		
		<img  draggable="true" ondragstart="dragCard(event)" class="cardImg <%if(this.tapped){%>tapped<%}%>" src="<%this.image%>" uid="<%this.uid%>" <%if(this.pile.pileClass=='playerHand'){%>style = "<%handRotation(this)%>"<%}%>>
	</div>
`;

const countersTemplate = `
	<div class="cardCountersContainerOuter">
		<div class="cardCountersContainer">
			<%for(let i in this.counters){%>
				<div class="cardCounter" style="background-color:<%i%>"><%this.counters[i]%></div>
			<%}%>
		</div>
	</div>
`;

const cardPreviewTemplate = `
	<div class="cardFrame">
		<img  draggable="false" class="cardImg largeCardImg" src="<%this.largeImage%>">
	</div>
`;

let logTemplate = `
	<div class="row logItem">
		<div class="logDate col-3"><%this.time.toLocaleString("en-UK").split(", ")[1]%></div>
		<div class="logPlayer col-9" style="color:<%this.player.colour%>;"><%this.player.player%></div>
		<div class="logMessage col-12"><%this.msg%></div>
	</div>
`

const iconsTemplate = `
<div class="keywordIconContainer">
	<%for(let i in this.icons){%>
		<span class="fa fa-<%this.icons[i].icon%> keywordIcon" style="color:<%this.icons[i].colour%>;" title="<%i%>"></span>
	<%}%>
</div>

`

const viewPileTemplate = `
	<div class="viewPile">
		<%for(let i in this.cards){%>
			<%TemplateEngine(cardTemplate,this.cards[i])%>
		<%}%>
	</div>
`;

const pileTemplate = `
	<div class="pile">
		<%if(this.spread){%>
			<%for(let i in this.cards){%>
				<%TemplateEngine(cardTemplate,this.cards[i])%>
			<%}%>
		<%}else if(this.cards.length){%>
			<%TemplateEngine(cardTemplate,this.cards[this.faceUp?this.cards.length-1:0])%>
		<%}%>
	
	
	</div>
`;

const fieldTemplate = `
	<div class="playerSide" player="<%this.player%>">
		

		<div class="container field" >
			<div class="row">
				<div class="playerPile playerGrave col-1">
					<!-- gy -->
				</div>
				<div class="playerPile playerCreatures col-6">
					<!-- creatures -->
				</div>
				<div class="playerPile playerArtifacts col-5">
					<!-- artifacts -->
				</div>
			</div>
			<div class="row">
				<div class="playerPile playerDeck col-1">
					<!-- deck -->
				</div>
				<div class="playerPile playerLands col-6">
					<!-- lands -->
				</div>
				<div class="playerPile playerWalkers col-4">
					<!-- walkers -->
				</div>
				<div class="playerPile playerExiled col-1">
					<!-- exiled -->
				</div>
			</div>
		
		
		</div>
		
		<div class="playerHand">
		
		</div>
		
	</div>


`