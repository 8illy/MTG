const cardTemplate = `
	<div class="cardFrame" onmouseover="previewCard(cards['<%this.uid%>'])" onauxclick="cards['<%this.uid%>'].auxClick(event)" onclick="cards['<%this.uid%>'].click(event)" >
		<img  draggable="true" ondragstart="dragCard(event)" class="cardImg <%if(this.tapped){%>tapped<%}%>" src="<%this.image%>" uid="<%this.uid%>" <%if(this.pile.pileClass=='playerHand'){%>style = "<%handRotation(this)%>"<%}%>>
	</div>
`;

const cardPreviewTemplate = `
	<div class="cardFrame">
		<img  draggable="false" class="cardImg largeCardImg" src="<%this.largeImage%>">
	</div>
`;

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