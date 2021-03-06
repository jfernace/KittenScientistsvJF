// ==UserScript==
// @name        Kitten Scientists
// @namespace   http://www.reddit.com/r/kittensgame/comments/34gb2u/kitten_scientists_automation_script/
// @description Launch Kitten Scientists
// @include     *bloodrizer.ru/games/kittens/*
// @include     file:///*kitten-game*
// @version     1.4.0
// @grant       none
// @copyright   2015, cameroncondry
// ==/UserScript==

// ==========================================
// Begin Kitten Scientist's Automation Engine
// ==========================================

var version = 'Kitten Scientists version 1.4.0vJFv1';
var address = '1AQ1AC9W5CEAPgG5739XGXC5vXqyafhoLp';
// Game will be referenced in loadTest function
var game = null;
// Let's try adding in things here for the calculators
function buildUI() {
  $('#headerLinks').append(' | <a onclick="rebuildCalculatorUI();$(\'#kittenCalcs\').toggle();" href="#">Calculators</a>');

  var calcContainer = document.createElement('div');
  calcContainer.className = 'dialog help';
  calcContainer.id = 'kittenCalcs';
  calcContainer.style.display = 'none';
  calcContainer.style.overflowY = 'scroll';
  $('#midColumn').append(calcContainer);
}
function prepareContainer(id) {
  var result = $('#'+id);
  result.html('<a style="top: 10px; right: 45px; position: absolute;" onclick="$(\'#'+id+'\').hide();" href="#"><div style="position: fixed;">close</div></a>');
  return result
}
processAutoKittens = function() {
  updateCalculators();
}

autoKittensTimer = setInterval(processAutoKittens, 200);

if (!document.getElementById('timerTable')) {
  buildUI();
}

var calculators=[];
// Calculator UI

function addCalculator(container, id, title, contents, calc_func, sub_id, sub_title) {
  if (sub_id) {
    container.append('<h3 onclick="$(\'#'+id+'_container\').toggle();">'+title+' (click to show/hide)</h3>');
    if (calc_func) {
      calculators.push([[id, sub_id], calc_func]);
    }
    container.append('<div id="'+id+'_container" style="display:none">'+contents+'<div id="'+id+'"></div><h4 onclick="$(\'#'+sub_id+'\').toggle();">'+sub_title+' (click to show/hide)</h4><div id="'+sub_id+'" style="display:none"></div></div>');
  } else {
    container.append('<h3 onclick="$(\'#'+id+'\').toggle();">'+title+' (click to show/hide)</h3>');
    if (calc_func) {
      calculators.push([[id], calc_func]);
    }
    container.append('<div id="'+id+'" style="display:none">'+contents+'</div>');
  }
}

function updateCalculators() {
  for (var i in calculators) {
    var c = calculators[i];
    var contents = [].concat(c[1]());
    for (var j in c[0]) {
      $('#'+c[0][j]).html(contents[j])
    }
  }
}

function rebuildCalculatorUI() {
  var calcContainer = prepareContainer('kittenCalcs');
  calculators = [];
  addCalculator(calcContainer, 'unicornCalc', 'Unicorn structures', '', calculateUnicornBuild, 'unicornDetails', 'Calculation details');
  addCalculator(calcContainer, 'ChronoResCalc', 'Chronosphere Resets Resources', '', chronoCalculator);
  addCalculator(calcContainer, 'mintCalc', 'Mint efficiency calculator', '', mintCalculator);
  // calculateBuildingPrice();  
}

// Chronosphere Reset Calculator

function chronoCalculator() {
	var saveRatio = game.bld.get("chronosphere").val > 0 ? game.getEffect("resStasisRatio") : 0; 
	var newResources = [];
	var ignoreResources = ["kittens", "zebras", "unicorns", "alicorn", "tears", "furs", "ivory", "spice", "karma", "necrocorn"];
	var anachronomancy = game.prestige.getPerk("anachronomancy");
	var fluxCondensator = game.workshop.get("fluxCondensator");
	var resSummary = "";
	for (var i in game.resPool.resources){
		var res = game.resPool.resources[i];
		if ((res.craftable && res.name != "wood" && !fluxCondensator.researched) ||
			dojo.indexOf(ignoreResources, res.name) >= 0){
			continue;	//>:
		}
		var value = 0;
		if (res.name == "timeCrystal"){
			if (anachronomancy.researched){
				value = res.value;
			}
		} else if (res.persists){
			value = res.value;
		} else {
			if (!res.craftable || res.name == "wood"){
				value = res.value * saveRatio;
				if (res.name == "void") {
					value = Math.floor(value);
				}
			} else if (res.value > 0) {
				value = Math.sqrt(res.value) * saveRatio * 100;
			}
		}
		
		if (value > 0){
			var newRes = game.resPool.createResource(res.name);
			newRes.value = value;
			newResources.push(newRes);
			resSummary += '<br>'+newRes.name +':'+game.getDisplayValueExt(newRes.value);
		}
	}
	return resSummary;
	//summary(resSummary)
}


// Mint/hunter efficiency calculator

function mintCalculator() {
  var hunterRatio = game.getEffect("hunterRatio");

  var expectedFurs = 32.5 * (hunterRatio + 1);
  var expectedIvory = 20 * (hunterRatio + 1);
  if (2 * hunterRatio < 55) {
    expectedIvory *= 1 - (55 - 2 * hunterRatio) / 100;
  }

  var catpower = getResource('catpower');
  var catpowerRate = getResTick(getName('catpower')) * 5;
  var huntTime = 100/catpowerRate;
  var huntTimeWithMint = 100/(catpowerRate-3.75);
  var fpsNormal = expectedFurs/huntTime;
  var ipsNormal = expectedIvory/huntTime;
  var fpsWithMint = expectedFurs/huntTimeWithMint;
  var ipsWithMint = expectedIvory/huntTimeWithMint;

	var cpratio = (catpower.maxValue * 0.007) / 100;

	var fpsFromMint = cpratio * 1.25 * 5;
	var ipsFromMint = cpratio * 0.3 * 5;

  var mintsRunning = game.bld.get('mint').on;
  fpsNormal += fpsFromMint * mintsRunning;
  ipsNormal += ipsFromMint * mintsRunning;
  fpsWithMint += fpsFromMint * mintsRunning;
  ipsWithMint += ipsFromMint * mintsRunning;

  var result = "";
  result += "Average furs per hunt: " + game.getDisplayValue(expectedFurs);
  result += "<br>Average ivory per hunt: " + game.getDisplayValue(expectedIvory);
  result += "<br>Average time between hunts: " + game.getDisplayValue(huntTime);
  result += "<br>Approximate furs per second: " + game.getDisplayValue(fpsNormal);
  result += "<br>Approximate ivory per second: " + game.getDisplayValue(ipsNormal);
  result += "<br><br>With extra mint running:<br>Approximate furs per second: " + game.getDisplayValue(fpsWithMint + fpsFromMint);
  result += "<br>Approximate ivory per second: " + game.getDisplayValue(ipsWithMint + ipsFromMint);
  result += "<br><br>Profit from extra mint:<br>Furs per second: " + game.getDisplayValue(fpsFromMint + fpsWithMint - fpsNormal);
  result += "<br>Ivory per second: " + game.getDisplayValue(ipsFromMint + ipsWithMint - ipsNormal);
  return result;  
        function getResource(name) {
            for (var i in game.resPool.resources) {
                var res = game.resPool.resources[i];
                if (res.name === getName(name)) return res;
            }
            warning('unable to find resource ' + name);
            return null;
        }
		function getName(name) {
            // adjust for spelling discrepancies in core game logic
            if ('catpower' === name) name = 'manpower';
            if ('compendium' === name) name = 'compedium';
            if ('concrete' === name) name = 'concrate';
            return name;
        }
		function getResTick(name){
		 var resPerTick = game.getResourcePerTick(name, true);
		 return resPerTick;
		}
}

// Unicorn calculator

function getZiggurats() {
  return game.bld.get('ziggurat').val;
}

function calculateUnicornBuild() {
  if (game.bld.get('unicornPasture').val == 0)
    return 'You need at least one Unicorn Pasture to use this. Send off some hunters!';
  var ziggurats = getZiggurats();
   if (ziggurats == 0)
    return 'You need at least one Ziggurat to use this.';

  var startUps = calculateEffectiveUps();

  var details = '';

  var result = 'Base unicorn production per second: ' + game.getDisplayValue(calculateBaseUps());
  result += '<br>Rift production per second (amortized): ' + game.getDisplayValue(calculateRiftUps());
  result += '<br>Current effective unicorn production per second: ' + game.getDisplayValue(startUps);
 
 //Let's add in a sorrow/second calculator; Sorrow is 10k tears; Tear production/s is UnicornProd/s(/2500*NumZigs)
 //, use the startUps
 var Tearps = startUps/2500 * ziggurats;
 var Sorrowps = Tearps/10000*3600;
 
 result += '<br>Effective Tears/second: ' + game.getDisplayValue(Tearps);
 result += '<br>Effective Sorrow/hour: ' + game.getDisplayValue(Sorrowps);
 
  var buildings = ['Unicorn Pasture', 'Unicorn Tomb', 'Ivory Tower', 'Ivory Citadel', 'Sky Palace', 'Unicorn Utopia', 'Sunspire'];
  var tears = getTearPrices();
  var ivory = getIvoryPrices();
  var increases = [0, 0, 0, 0, 0, 0, 0];
  var best = 0, secondBest = 0;
  for (var i = 0; i < 7; i++) {
    extras = [0, 0, 0, 0, 0, 0, 0];
    extras[i] = 1;
    increases[i] = calculateEffectiveUps(extras) - startUps;
    if (tears[best] / increases[best] > tears[i] / increases[i]) {
      secondBest = best;
      best = i;
    }
    if (tears[secondBest] / increases[secondBest] > tears[i] / increases[i] && i != best || secondBest == best) {
      secondBest = i;
    }
     details += 'Unicorn/s increase with 1 more ' + buildings[i] + ': ' + game.getDisplayValue(increases[i]);
    if (i != 0) {
      details += '<br>Total unicorns needed: ' + game.getDisplayValueExt(Math.ceil(tears[i] / ziggurats) * 2500);
      details += ' (' + game.getDisplayValueExt(tears[i]) +' tears, ' + Math.ceil(tears[i] / ziggurats) + ' sacrifice(s))';
      details += '<br>'+checkUnicornReserves(tears[i], false, startUps, ivory[i])
    } else {
      details += '<br>Total unicorns needed: ' + game.getDisplayValueExt(tears[i] / ziggurats * 2500);
      details += '<br>'+checkUnicornReserves(tears[i] / ziggurats * 2500, true, startUps, ivory[i])
    }
    details += '<br>Tears for 1 extra unicorn/s: ' + game.getDisplayValueExt(tears[i] / increases[i]) + '<br><br>'; 
  }

  result += '<br><br>Best purchase is '+buildings[best]+', by a factor of ' + game.getDisplayValue((tears[secondBest] / increases[secondBest]) / (tears[best] / increases[best]));
  if (best != 0) {
    result += '<br>'+checkUnicornReserves(tears[best], false, startUps, ivory[best])
  } else {
    result += '<br>'+checkUnicornReserves(tears[best] / ziggurats * 2500, true, startUps, ivory[best])
  }

  return [result, details];  

}

function checkUnicornReserves(resNumber, isPasture, currUps, ivoryNeeded) {
  var unicornsLeft = 0;
  if (!isPasture) {
    var tearsLeft = resNumber - game.resPool.get('tears').value;
    unicornsLeft = 2500 * Math.ceil(tearsLeft / getZiggurats());
  } else {
    unicornsLeft = resNumber;
  }
  unicornsLeft = unicornsLeft - game.resPool.get('unicorns').value;
  var ivoryLeft = ivoryNeeded - game.resPool.get('ivory').value;
  if (unicornsLeft > 0) {
    return "Need "+game.getDisplayValueExt(unicornsLeft)+" more unicorns (~ "+game.toDisplaySeconds(unicornsLeft/currUps)+").";
  } if (ivoryLeft > 0){
    return "Need more ivory to build this.";
  } else {
    return "You can build this.";
  }
}

function getTearPrices() {
  var result = [0, 0, 0, 0, 0, 0, 0];
  var buildings = [game.bld.get('unicornPasture'), game.religion.getZU('unicornTomb'), game.religion.getZU('ivoryTower'), game.religion.getZU('ivoryCitadel'), game.religion.getZU('skyPalace'), game.religion.getZU('unicornUtopia'), game.religion.getZU('sunspire')]
  for (var i = 0; i < 7; i++) {
    for (var j = 0; j < buildings[i].prices.length; j++) {
      if (buildings[i].prices[j].name == 'unicorns') {
        result[i] = calcPrice(buildings[i].prices[j].val, game.bld.getPriceRatio(buildings[i].name), buildings[i].val) / 2500 * getZiggurats();
      } else if (buildings[i].prices[j].name == 'tears') {
        result[i] = calcPrice(buildings[i].prices[j].val, buildings[i].priceRatio, buildings[i].val);
      }
    }
  }
  return result;
}

function getIvoryPrices() {
  var result = [0, 0, 0, 0, 0, 0, 0];
  var buildings = [game.bld.get('unicornPasture'), game.religion.getZU('unicornTomb'), game.religion.getZU('ivoryTower'), game.religion.getZU('ivoryCitadel'), game.religion.getZU('skyPalace'), game.religion.getZU('unicornUtopia'), game.religion.getZU('sunspire')]
  for (var i = 0; i < 7; i++) {
    for (var j = 0; j < buildings[i].prices.length; j++) {
      if (buildings[i].prices[j].name == 'ivory') {
        result[i] = calcPrice(buildings[i].prices[j].val, buildings[i].priceRatio, buildings[i].val);
      }
    }
  }
  return result;
}

function calcPrice(base, ratio, num) {
  for (i = 0; i < num; i++) {
    base *= ratio;
  }
  return base;
}
function isDarkFuture() {
	return game.calendar.year - 40000 - game.time.flux - game.getEffect("timeImpedance") >= 0;
}

function calculateBaseUps(extras) {
  extras = extras || [];
 //var catpowerRate = getResTick(getName('catpower')) * 5;
 //Basic way to do this: UnicornsPerTick = game.getResourcePerTick('unicorns', true);
 
 //Need to add in the unicornSelection upgrade because it is currently not being applied
 var unicSel = 1;
 if (game.workshop.get('unicornSelection').researched){
	 unicSel = 1.25;
 }
 
  var pastures = game.bld.get('unicornPasture').val + (extras[0] || 0);
  var baseUps = pastures * game.bld.get('unicornPasture').effects['unicornsPerTickBase'] * game.rate;

  var tombs = game.religion.getZU('unicornTomb').val + (extras[1] || 0);
  var towers = game.religion.getZU('ivoryTower').val + (extras[2] || 0);
  var citadels = game.religion.getZU('ivoryCitadel').val + (extras[3] || 0);
  var palaces = game.religion.getZU('skyPalace').val + (extras[4] || 0);
  var utopias = game.religion.getZU('unicornUtopia').val + (extras[5] || 0);
  var sunspires = game.religion.getZU('sunspire').val + (extras[6] || 0);
  
  var tombEffect = game.religion.getZU('unicornTomb').effects['unicornsRatioReligion'];
  var towerEffect = game.religion.getZU('ivoryTower').effects['unicornsRatioReligion'];
  var citadelEffect = game.religion.getZU('ivoryCitadel').effects['unicornsRatioReligion'];
  var palaceEffect = game.religion.getZU('skyPalace').effects['unicornsRatioReligion'];
  var utopiaEffect = game.religion.getZU('unicornUtopia').effects['unicornsRatioReligion'];
  var sunspireEffect = game.religion.getZU('sunspire').effects['unicornsRatioReligion'];
  var bldEffect = 1 + tombEffect * tombs + towerEffect * towers + citadelEffect * citadels + palaceEffect * palaces + utopiaEffect * utopias + sunspireEffect*sunspires;

  var faithEffect = 1;
  faithEffect += game.religion.getProductionBonus() / 100;
 /*  if (game.religion.getRU("solarRevolution").researched){
    faithEffect += game.religion.getProductionBonus() / 100;
  } */
  var paragonRatio = 1 + game.getEffect("paragonRatio");
  var paragonProdRatio = game.resPool.get("paragon").value * 0.01 * paragonRatio;
	paragonProdRatio = 1 + game.getHyperbolicEffect(paragonProdRatio, 2 * paragonRatio);
 var BPratio = isDarkFuture() ? 4 : 1;
 var burnedparagonRatio = game.resPool.get("burnedParagon").value * 0.01 * paragonRatio;
  burnedparagonRatio = game.getHyperbolicEffect(burnedparagonRatio,BPratio * paragonRatio);
  
  return baseUps * unicSel * bldEffect * faithEffect * (paragonProdRatio + burnedparagonRatio);

}

function calculateRiftUps(extras) {
  extras = extras || [];
  var unicornChanceRatio = 1;
  if (game.prestige.getPerk("unicornmancy").researched){
		unicornChanceRatio = 1.1;
	}
  return Math.min(500, 0.25 * unicornChanceRatio * (game.religion.getZU('ivoryTower').val + (extras[2] || 0))) * game.calendar.dayPerTick * game.rate;
}

function calculateEffectiveUps(extras) {
  return calculateBaseUps(extras) + calculateRiftUps(extras);
}

 


// endmodification

var run = function() {

    var options = {
        // When debug is enabled, messages that go to the game log are also logged using window.console.
        debug: false,

        // The interval at which the internal processing loop is run, in milliseconds.
        interval: 2000,

        // The default color for KS messages in the game log (like enabling and disabling items).
        msgcolor: '#aa50fe', // dark purple
        // The color for activity summaries.
        summarycolor: '#009933', // light green
        // The color for log messages that are about activities (like festivals and star observations).
        activitycolor: '#E65C00', // orange
	// The color for resources with stock counts higher than current resource max
        stockwarncolor: '#DD1E00',
	    
        // Should activity be logged to the game log?
        showactivity: true,

        // The default consume rate.
        consume: 0.6,

        // How many messages to keep in the game log.
        logMessages:   100,

        // The default settings for game automation.
        auto: {
            // Settings related to KS itself.
            engine: {
                // Should any automation run at all?
                enabled: false
            },
			crypto: {
                // Should crypto exchange be automated?
                enabled: false,
                // At what percentage of the relic storage capacity should KS exchange?
                trigger: 10000
            },
			explore: {
				// Should exploring be automated?
                enabled: false,
			},
            faith: {
                // Should praising be automated?
                enabled: true,
                // At what percentage of the faith storage capacity should KS praise the sun?
                trigger: 0.99,
			// Which religious upgrades should be researched?
				items: {
					// Order of the Sun
					solarchant:	{require: 'faith', enabled: true},
					scholasticism:	{require: 'faith', enabled: true},
					goldenSpire:    {require: 'faith', enabled: true},
					sunAltar:       {require: 'faith', enabled: true},
					stainedGlass:   {require: 'faith', enabled: true},
					solarRevolution:{require: 'faith', enabled: true},
					basilica:       {require: 'faith', enabled: true},
					templars:       {require: 'faith', enabled: true},
					apocripha:      {require: 'faith', enabled: false},
					transcendence:  {require: 'faith', enabled: true},
					}
            },
            festival: {
                // Should festivals be held automatically?
                enabled: false
            },
            hunt: {
                // Should hunters be sent on hunts automatically?
                enabled: true,
                // At what percentage of the catpower storage capacity should KS send hunters on hunts?
                trigger: 0.6
            },
            build: {
                // Should buildings be built automatically?
                enabled: true,
                // When a building requires a certain resource (this is what their *require* property refers to), then
                // this is the percentage of the storage capacity of that resource, that has to be met for the building
                // to be built.
                trigger: 0.75,
                // The items that be automatically built.
                // Every item can define a required resource. This resource has to be available at a certain capacity for
                // the building to be built. The capacity requirement is defined by the trigger value set for the section.
                
                // Additionally, for upgradeable buildings, the item can define which upgrade stage it refers to.
                // For upgraded buildings, the ID (or internal name) of the building can be controlled through the *name*
                // property. For other buildings, the key of the item itself is used.
                items: {
                    // housing
                    hut:            {require: 'wood',        enabled: false},
                    logHouse:       {require: 'minerals',    enabled: false},
                    mansion:        {require: 'titanium',    enabled: false},

                    // craft bonuses
                    workshop:       {require: 'minerals',    enabled: true},
                    factory:        {require: 'titanium',    enabled: true},

                    // production
                    field:          {require: 'catnip',      enabled: true},
                    pasture:        {require: 'catnip',      enabled: true, stage: 0},
                    solarFarm:      {require: 'titanium',    enabled: true, stage: 1, name: 'pasture'},
                    mine:           {require: 'wood',        enabled: true},
                    lumberMill:     {require: 'minerals',    enabled: true},
                    aqueduct:       {require: 'minerals',    enabled: true, stage: 0},
                    hydroPlant:     {require: 'titanium',    enabled: true, stage: 1, name: 'aqueduct'},
                    oilWell:        {require: 'coal',        enabled: true},
                    quarry:         {require: 'coal',        enabled: true},

                    // conversion
                    smelter:        {require: 'minerals',    enabled: true},
                    biolab:         {require: 'science',     enabled: false},
                    calciner:       {require: 'titanium',    enabled: false},
                    reactor:        {require: 'titanium',    enabled: false},
                    accelerator:    {require: 'titanium',    enabled: false},
                    steamworks:     {require: false,         enabled: false},
                    magneto:        {require: false,         enabled: false},

                    // science
                    library:        {require: 'wood',        enabled: true},
                    academy:        {require: 'wood',        enabled: true},
                    observatory:    {require: 'iron',        enabled: true},

                    // other
                    amphitheatre:   {require: 'minerals',    enabled: true, stage: 0},
                    broadcastTower: {require: 'titanium',    enabled: true, stage: 1, name: 'amphitheatre'},
                    tradepost:      {require: 'gold',        enabled: true},
                    chapel:         {require: 'minerals',    enabled: true},
                    temple:         {require: 'gold',        enabled: true},
                    mint:           {require: false,         enabled: false},
                    unicornPasture: {require: false,         enabled: true},
                    ziggurat:       {require: false,         enabled: true},
                    chronosphere:   {require: 'unobtainium', enabled: true},
					aiCore:         {require: false,         enabled: false},
					
                    // storage
                    barn:           {require: 'wood',        enabled: true},
                    harbor:         {require: false,         enabled: false},
                    warehouse:      {require: false,         enabled: false}
                }
            },
            space: {
                // Should space buildings be built automatically?
                enabled: false,
                // The functionality of the space section is identical to the build section. It just needs to be treated
                // seperately, because the game internals are slightly different.
                trigger: 0.95,
                items: {
                    // Cath
                    spaceElevator:  {require: 'unobtainium', enabled: false},
                    sattelite:      {require: 'titanium',    enabled: false},
                    spaceStation:   {require: 'oil',         enabled: false},

                    // Moon
                    moonOutpost:    {require: 'uranium',     enabled: false},
                    moonBase:       {require: 'unobtainium', enabled: false},

                    // Dune
                    planetCracker:  {require: 'science',     enabled: false},
                    hydrofracturer: {require: 'science',     enabled: false},
					spiceRefinery:  {require: 'science',     enabled: false},
			
                    // Piscine
                    researchVessel: {require: 'titanium',    enabled: false},
                    orbitalArray:   {require: 'eludium',     enabled: false},

                    // Helios
                    sunlifter:          {require: 'eludium', enabled: false},
                    containmentChamber: {require: 'science', enabled: false},
                    heatsink:           {require: 'thorium', enabled: false},
                    sunforge:           {require: false,     enabled: false},
					
                    // T-Minus
                    cryostation:    {require: 'eludium',     enabled: false},

                    // Kairo
                    spaceBeacon:    {require: 'antimatter',  enabled: false},

                    // Yarn
                    terraformingStation: {require: 'antimatter',  enabled: false},
                    hydroponics:         {require: 'kerosene',    enabled: false},
					
                    // Umbra
                    hrHarvester:    {require: 'antimatter',  enabled: false},

                    // Charon
                    entangler:    {require: 'antimatter',  enabled: false},
					
                    // Centaurus
                    tectonic: {require: 'antimatter', enabled: false}
                }
            },
            craft: {
                // Should resources be crafted automatically?
                enabled: true,
                // Every item can define a required resource with the *require* property.
                // At what percentage of the storage capacity of that required resource should the listed resource be crafted?
                trigger: 0.95,
                // The items that can be crafted.
                // In addition to the *require* property, which is explained above, items can also define a *max*. If they
                // do, no more than that resource will be automatically produced. This feature can not be controlled through
                // the UI and is not used for any resource by default.
                // The *limited* property tells KS to only craft the resource once per season.
                items: {
                    wood:       {require: 'catnip',      max: 0, limited: false, enabled: true},
                    beam:       {require: 'wood',        max: 0, limited: false, enabled: true},
                    slab:       {require: 'minerals',    max: 0, limited: false, enabled: true},
                    steel:      {require: 'coal',        max: 0, limited: false, enabled: true},
                    plate:      {require: 'iron',        max: 0, limited: false, enabled: true},
                    alloy:      {require: 'titanium',    max: 0, limited: true,  enabled: false},
                    concrete:   {require: false,         max: 0, limited: true,  enabled: false},
                    gear:       {require: false,         max: 0, limited: true,  enabled: false},
                    scaffold:   {require: false,         max: 0, limited: true,  enabled: false},
                    ship:       {require: false,         max: 0, limited: true,  enabled: false},
                    tanker:     {require: false,         max: 0, limited: true,  enabled: false},
                    parchment:  {require: false,         max: 0, limited: true,  enabled: true},
                    manuscript: {require: 'culture',     max: 0, limited: true,  enabled: true},
                    compendium: {require: 'science',     max: 0, limited: true,  enabled: true},
                    blueprint:  {require: 'science',     max: 0, limited: true,  enabled: false},
                    kerosene:   {require: 'oil',         max: 0, limited: true,  enabled: false},
                    megalith:   {require: false,         max: 0, limited: true,  enabled: false},
                    eludium:    {require: 'unobtainium', max: 0, limited: true,  enabled: false},
                    thorium:    {require: 'uranium',     max: 0, limited: true,  enabled: false}
                }
            },
            trade: {
                // Should KS automatically trade?
                enabled: true,
                // Every trade can define a required resource with the *require* property.
                // At what percentage of the storage capacity of that required resource should the trade happen?
                trigger: 0.95,
                // Trades can be limited to only happen during specific seasons. This is because trades with certain races
                // are more effective during specific seasons.
                // The *allowcapped* property allows us to trade even if the sold resources are at their cap.
                items: {
                    dragons:    {enabled: false,  require: 'titanium',    allowcapped: false,
                        summer:  true,  autumn:  true,  winter:  true,          spring:      true},

                    zebras:     {enabled: true,  require: false,         allowcapped: false,
                        summer:  true,  autumn:  true,  winter:  true,          spring:      true},

                    lizards:    {enabled: false,  require: 'minerals',    allowcapped: false,
                        summer:  true,  autumn:  false, winter:  false,         spring:      false},

                    sharks:     {enabled: false,  require: 'iron',        allowcapped: false,
                        summer:  false, autumn:  false, winter:  true,          spring:      false},

                    griffins:   {enabled: false,  require: 'wood',        allowcapped: false,
                        summer:  false, autumn:  true,  winter:  false,         spring:      false},

                    nagas:      {enabled: false,  require: false,         allowcapped: false,
                        summer:  false, autumn:  false, winter:  false,         spring:      true},

                    spiders:    {enabled: false,  require: false,         allowcapped: false,
                        summer:  false, autumn:  true,  winter:  false,         spring:      false},

                    leviathans: {enabled: false,  require: 'unobtainium', allowcapped: true,
                        summer:  true,  autumn:  true,  winter:  true,          spring:      true}
                }
            },
            resources: {
                furs:        {stock: 1000},
                unobtainium: {consume: 1.0}
            },//and the comma (here)
		//here
		UniCalc: {
			enabled: false
		}
		
		}
    };

    // GameLog Modification
    // ====================

    // Add a message filter for trades
    if (!game.console.filters.trade){
        game.console.filters.trade = {
            title: "Trades",
            enabled: false,
            unlocked: true
        };
        game.ui.renderFilters();
    }

    // Increase messages displayed in log
    game.console.maxMessages = 1000;
	// Message logging function (colors)
    var printoutput = function (args) {
        var color = args.pop();
        args[1] = args[1] || 'ks-default';

        // update the color of the message immediately after adding
        var msg = game.msg.apply(game, args);
        $(msg.span).css('color', color);

        if (options.debug && console) console.log(args);
    };

    // Used for option change messages and other special notifications
    var message = function () {
        var args = Array.prototype.slice.call(arguments);
        args.push('ks-default');
        args.push(options.msgcolor);
        printoutput(args);
    };

    var activity = function () {
        if (options.showactivity) {
            var args = Array.prototype.slice.call(arguments);
            var activityClass = args.length > 1 ? ' type_' + args.pop() : '';
            args.push('ks-activity' + activityClass);
            args.push(options.activitycolor);
            printoutput(args);
        }
    };

    var summary = function () {
        var args = Array.prototype.slice.call(arguments);
        args.push('ks-summary');
        args.push(options.summarycolor);
        printoutput(args);
    };

    var warning = function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('Warning!');

        if (console) console.log(args);
    };

    // Core Engine for Kitten Scientists
    // =================================

    var Engine = function () {
        this.buildManager = new BuildManager();
        this.spaceManager = new SpaceManager();
        this.craftManager = new CraftManager();
        this.tradeManager = new TradeManager();
        this.villageManager = new TabManager('Village');
		this.explorationManager = new ExplorationManager();
		this.religionManager = new ReligionManager();
    };

    Engine.prototype = {
        buildManager: undefined,
        spaceManager: undefined,
        craftManager: undefined,
        tradeManager: undefined,
        villageManager: undefined,
		explorationManager: undefined,
		religionManager: undefined,
        loop: undefined,
        start: function () {
            if (this.loop) return;

            this.loop = setInterval(this.iterate.bind(this), options.interval);
            message('Enabling the kitten scientists!');
        },
        stop: function () {
            if (!this.loop) return;

            clearInterval(this.loop);
            this.loop = undefined;
            message('Disabling the kitten scientists!');
        },
        iterate: function () {
            this.observeStars();
            if (options.auto.festival.enabled) this.holdFestival();
            if (options.auto.build.enabled) this.build();
            if (options.auto.space.enabled) this.space();
            if (options.auto.craft.enabled) this.craft();
            if (options.auto.trade.enabled) this.trade();
            if (options.auto.hunt.enabled) this.hunt();
			if (options.auto.UniCalc.enabled) this.UniCalc();//here
			if (options.auto.faith.enabled) this.worship();
			if (options.auto.crypto.enabled) this.crypto();
            if (options.auto.explore.enabled) this.explore();
        },
		crypto: function () {
            var coinPrice = game.calendar.cryptoPrice;
            var previousRelic = game.resPool.get('relic').value;
            var previousCoin = game.resPool.get('blackcoin').value;
            var exchangedCoin = 0.0;
            var exchangedRelic = 0.0;
			var waitForBestPrice = false;

            // Only exchange if it's enabled
            if (!options.auto.crypto.enabled) return;

			// Waits for coin price to drop below a certain treshold before starting the exchange process
			if (waitForBestPrice == true && coinPrice < 860.0) { waitForBestPrice = false; }

			// Exchanges up to a certain threshold, in order to keep a good exchange rate, then waits for a higher treshold before exchanging for relics.
            if (waitForBestPrice == false && coinPrice < 950.0 && previousRelic > options.auto.crypto.trigger) {
                var currentCoin;

                game.diplomacy.buyEcoin();

                currentCoin = game.resPool.get('blackcoin').value;
                exchangedCoin = Math.round(currentCoin - previousCoin);
                activity('Kittens sold your Relics and bought '+ exchangedCoin +' Blackcoins');
            }
            else if (coinPrice > 1050.0 && game.resPool.get('blackcoin').value > 0) {
                var currentRelic;

				waitForBestPrice = true;

                game.diplomacy.sellEcoin();

                currentRelic = game.resPool.get('blackcoin').value;
                exchangedRelic = Math.round(currentRelic - previousRelic);

                activity('Kittens sold your Blackcoins and bought '+ exchangedRelic +' Relics');
            }
        },		
		explore: function () {
			var manager = this.explorationManager;
			var expeditionNode = game.village.map.expeditionNode;

			// Only exchange if it's enabled
            if (!options.auto.explore.enabled) return;

			if( expeditionNode == null) {
				manager.getCheapestNode();

				manager.explore(manager.cheapestNodeX, manager.cheapestNodeY);

				activity('Your kittens started exploring node '+ manager.cheapestNodeX +'-'+ manager.cheapestNodeY +' of the map.');
			}
		},		
        build: function () {
            var builds = options.auto.build.items;
            var buildManager = this.buildManager;
            var craftManager = this.craftManager;
            var trigger = options.auto.build.trigger;

            // Render the tab to make sure that the buttons actually exist in the DOM. Otherwise we can't click them.
            buildManager.manager.render();
			buildLoop:
            for (var name in builds) {
                if (!builds[name].enabled) continue;

                var build = builds[name];
                var require = !build.require ? false : craftManager.getResource(build.require);

                if (!require || trigger <= require.value / require.maxValue) {
                   //verify that the building prices are within the current stock settings
					var prices = game.bld.getPrices(build.name || name);
					for (var p = 0; p < prices.length; p++) {
						if (craftManager.getValueAvailable(prices[p].name, true) < prices[p].val) continue buildLoop;
					}
			
		    		// If the build overrides the name, use that name instead.
                    // This is usually true for buildings that can be upgraded.
                    buildManager.build(build.name || name, build.stage);
                }
            }
        },
        space: function () {
            var builds = options.auto.space.items;
            var buildManager = this.spaceManager;
            var craftManager = this.craftManager;
            var trigger = options.auto.space.trigger;

            // Render the tab to make sure that the buttons actually exist in the DOM. Otherwise we can't click them.
            buildManager.manager.render();

            for (var name in builds) {
                var build = builds[name];
                var require = !build.require ? false : craftManager.getResource(build.require);

                if (!require || trigger <= require.value / require.maxValue) {
                    buildManager.build(name);
                }
            }
        },
        craft: function () {
            var crafts = options.auto.craft.items;
            var manager = this.craftManager;
            var trigger = options.auto.craft.trigger;

            for (var name in crafts) {
                var craft = crafts[name];
                var current = !craft.max ? false : manager.getResource(name);
                var require = !craft.require ? false : manager.getResource(craft.require);
                var season = game.calendar.season;

                // Ensure that we have reached our cap
                if (current && current.value > craft.max) continue;

                // Enforce season limited on specific crafts
                if (craft.limited && craft.lastSeason === season) continue;

                // Craft the resource if we meet the trigger requirement
                if (!require || trigger <= require.value / require.maxValue) {
                    var amount = manager.getLowestCraftAmount(name, craft.limited);

                    // Only update season if we actually craft anything.
                    if (amount > 0) {
                        manager.craft(name, amount);

                        // Store the season for future reference
                        craft.lastSeason = season;
                    }
                }
            }
        },
        holdFestival: function () {
			this.villageManager.render();
            if (game.science.get('drama').researched && game.calendar.festivalDays === 0 && game.villageTab.festivalBtn.model.enabled) {
                game.villageTab.festivalBtn.onClick();

                if (game.calendar.festivalDays !== 0) {
                    storeForSummary('festival');
                    activity('Kittens begin holding a festival', 'ks-festival');
                }
            }
        },
        observeStars: function () {
            if (game.calendar.observeBtn != null){
                game.calendar.observeHandler();
                activity('Kitten Scientists have observed a star', 'ks-star');
                storeForSummary('stars', 1);
            }
        },
		worship: function () {
			var builds = options.auto.faith.items;
			var buildManager = this.religionManager;
			var craftManager = this.craftManager;
			var trigger = options.auto.faith.trigger;

			// Render the tab to make sure that the buttons actually exist in the DOM. Otherwise we can't click them.
			buildManager.manager.render();

			for (var name in builds) {
				if (!builds[name].enabled) continue;
				var build = builds[name];
				var require = !build.require ? false : craftManager.getResource(build.require);
				if (!require || trigger <= require.value / require.maxValue) {
					buildManager.build(name);
				}
			}
			// Praise the sun with any faith left over
			var faith = craftManager.getResource('faith');
			if (options.auto.faith.trigger <= faith.value / faith.maxValue) {
				storeForSummary('faith',faith.value * (1 + game.religion.getFaithBonus()));
				activity('Praised the sun!','ks-praise');
				game.religion.praise();
			}
		},
		UniCalc: function () {
/////////////////////////////////////////////////------------------------------------
			if (game.bld.get('unicornPasture').val == 0)
				return 'You need at least one Unicorn Pasture to use this. Send off some hunters!';
			var ziggurats = getZiggurats();
			if (ziggurats == 0)
				return 'You need at least one Ziggurat to use this.';

			var startUps = calculateEffectiveUps();

			var result = '';
			var buildings = ['Unicorn Pasture', 'Unicorn Tomb', 'Ivory Tower', 'Ivory Citadel', 'Sky Palace', 'Unicorn Utopia', 'Sunspire'];
			var tears = getTearPrices();
			var ivory = getIvoryPrices();
			var increases = [0, 0, 0, 0, 0, 0, 0];
			var best = 0, secondBest = 0;
			for (var i = 0; i < 7; i++) {
				extras = [0, 0, 0, 0, 0, 0, 0];
				extras[i] = 1;
				increases[i] = calculateEffectiveUps(extras) - startUps;
				if (tears[best] / increases[best] > tears[i] / increases[i]) {
					secondBest = best;
					best = i;
				}
				if (tears[secondBest] / increases[secondBest] > tears[i] / increases[i] && i != best || secondBest == best) {
					secondBest = i;
				}
			}

			result = '<br>' + buildings[best] + ',x ' + game.getDisplayValue((tears[secondBest] / increases[secondBest]) / (tears[best] / increases[best]));
			result += ',------> ' + buildings[secondBest];
			if (best != 0) {
				result += '<br>' + checkUnicornReserves(tears[best], false, startUps, ivory[best])
			} else {
				result += '<br>' + checkUnicornReserves(tears[best] / ziggurats * 2500, true, startUps, ivory[best])
			}
			
			summary(result); //woot, this works!
		},
///////////////////////-----------------------------------------------------
        hunt: function () {
            var catpower = this.craftManager.getResource('catpower');

            if (options.auto.hunt.trigger <= catpower.value / catpower.maxValue && catpower.value >= 100) {
                // No way to send only some hunters. Thus, we hunt with everything
                var hunters = game.village.getJob('hunter').value;
                storeForSummary('hunt', hunters);
                activity('Sent ' + game.getDisplayValueExt(hunters) + ' kitten' + (hunters == 1 ? '' : 's') + ' on the hunt', 'ks-hunt');
                game.village.huntAll();
            }
        },
        trade: function () {
            var craftManager = this.craftManager;
            var tradeManager = this.tradeManager;
            var gold = craftManager.getResource('gold');
            var trades = [];

            // Only trade if it's enabled
            if (!options.auto.trade.enabled) return;

            // Trade when we have enough gold. Don't worry about catpower.
            if (options.auto.trade.trigger >= gold.value / gold.maxValue) return;

            // Determine how many races we will trade this cycle
            for (var name in options.auto.trade.items) {
                var trade = options.auto.trade.items[name];
                var season = game.calendar.getCurSeason().name;

                // Only check if we are in season and enabled
                if (!trade.enabled) continue;
                if (!trade[season]) continue;

                var require = !trade.require ? false : craftManager.getResource(trade.require);
				if (name === "leviathans") {
					var requireTrigger = 0.05;
					//summary('<br>yay!')
				} else {
					var requireTrigger = options.auto.trade.trigger;
				}

                // If we have enough to trigger the check, then attempt to trade
                if (!require || requireTrigger <= require.value / require.maxValue) {
                    trades.push(name);
                }
            }

            // Figure out how much we can currently trade
            var maxTrades = tradeManager.getLowestTradeAmount(undefined);

            // Try our best not to starve any single race
            maxTrades = (trades.length > 0) ? Math.floor(maxTrades / trades.length) : 0;

            if (maxTrades < 1) return;

            for (var i in trades) {
                var name = trades[i];
                tradeManager.trade(name, Math.min(tradeManager.getLowestTradeAmount(name), maxTrades));
            }
        }

    };

    // Tab Manager
    // ===========

    var TabManager = function (name) {
        this.setTab(name);
    };

    TabManager.prototype = {
        tab: undefined,
        render: function () {
            if (this.tab && game.ui.activeTabId !== this.tab.tabId) this.tab.render();

            return this;
        },
        setTab: function (name) {
            for (var tab in game.tabs) {
                if (game.tabs[tab].tabId === name) {
                    this.tab = game.tabs[tab];
                    break;
                }
            }

            this.tab ? this.render() : warning('unable to find tab ' + name);
        }
    };

	// Exploration Manager
	// ===================

	var ExplorationManager = function () {
		this.manager = new TabManager('Village');
	};
    
	ExplorationManager.prototype = {
		manager: undefined,
		currentCheapestNode: null,
		currentCheapestNodeValue: null,
		cheapestNodeX: null,
		cheapestNodeY: null,
		explore: function(x, y) {
			game.village.map.expeditionNode = {x, y};
			game.village.map.explore(x, y);
		},
		getCheapestNode: function () {
			var tileArray = game.village.map.villageData;
			var tileKey = "";

			this.currentCheapestNode = null;

			for (var i in tileArray) {
				tileKey = i;

				// Discards locked nodes
				if (i.unlocked == false) { break; }

				// Discards junk nodes
				if(tileKey.includes('-')) { break; }

				// Acquire node coordinates
				var regex = /(\d).(\d*)/g;
				var keyMatch = regex.exec(tileKey);
				var xCoord = parseInt(keyMatch[1]);
				var yCoord = parseInt(keyMatch[2]);

				if(this.currentCheapestNode == null) {
					this.currentCheapestNodeValue = this.getNodeValue(xCoord, yCoord)
					this.currentCheapestNode = i;
					this.cheapestNodeX = xCoord;
					this.cheapestNodeY = yCoord;
				}

				if (this.currentCheapestNode != null && this.getNodeValue(xCoord, yCoord) < this.currentCheapestNodeValue) {
					this.currentCheapestNodeValue = this.getNodeValue(xCoord, yCoord)
					this.currentCheapestNode = i;
					this.cheapestNodeX = xCoord;
					this.cheapestNodeY = yCoord;
				}
			}
		},
		getNodeValue: function (x, y){
			var nodePrice = game.village.map.toLevel(x, y);
			var exploreCost = game.village.map.getExplorationPrice(x,y);

			var tileValue = nodePrice / exploreCost;

			return tileValue;
		}
	};
	
	
	// Religion manager
	// ================
	
	var ReligionManager = function () {
		this.manager = new TabManager('Religion');
		this.crafts = new CraftManager();
	};
	ReligionManager.prototype = {
		manager: undefined,
		crafts: undefined,
		build: function (name) {
			var build = this.getBuild(name);
			var button = this.getBuildButton(name);
			if (!button || !button.model.enabled) return;
			// need to simulate a click so the game updates everything properly
			button.domNode.click(build);
			storeForSummary(name, 1, 'faith');
			activity('Kittens have discovered ' + build.label, 'ks-faith');
		},
		getBuild: function (name) {
			return game.religion.getRU(name);
		},
		getBuildButton: function (name) { 
			var buttons = this.manager.tab.rUpgradesButtons;
			var build = this.getBuild(name);
			for (var i in buttons) {
				var haystack = buttons[i].model.name;//buttons[i].model.options.name
				if (haystack.indexOf(build.label) !== -1) {
					return buttons[i];
				}
				//if (buttons[i].name === build.label) return buttons[i];
			}
		}
	};
	
	
	
    // Building manager
    // ================

    var BuildManager = function () {
        this.manager = new TabManager('Bonfire');
        this.crafts = new CraftManager();
    };

    BuildManager.prototype = {
        manager: undefined,
        crafts: undefined,
        build: function (name, stage) {
            var build = this.getBuild(name);
            var button = this.getBuildButton(name, stage);

            if (!button || !button.model.enabled) return;

            // need to simulate a click so the game updates everything properly
            button.domNode.click(build);
            storeForSummary(name, 1, 'build');

            var label = build.meta.label ? build.meta.label : build.meta.stages[0].label;
            activity('Kittens have built a new ' + label, 'ks-build');
        },
        getBuild: function (name) {
            return game.bld.getBuildingExt(name);
        },
        getBuildButton: function (name, stage) {
            var buttons = this.manager.tab.buttons;
            var build = this.getBuild(name);
            var label = typeof stage !== 'undefined' ? build.meta.stages[stage].label : build.meta.label;

            for (var i in buttons) {
                var haystack = buttons[i].model.name;
                if (haystack.indexOf(label) !== -1){
                    return buttons[i];
                }
            }
        }
    };

    // Space manager
    // ================

    var SpaceManager = function () {
        this.manager = new TabManager('Space');
        this.crafts = new CraftManager();
    };

    SpaceManager.prototype = {
        manager: undefined,
        crafts: undefined,
        build: function (name) {
            var build = this.getBuild(name);
            var button = this.getBuildButton(name);

            if (!build.unlocked || !button || !button.model.enabled || !options.auto.space.items[name].enabled) return;

            // need to simulate a click so the game updates everything properly
            button.domNode.click(build);
            storeForSummary(name, 1, 'build');

            var label = build.label;
            activity('Kittens have built a new ' + label, 'ks-build');
        },
        getBuild: function (name) {
            return game.space.getProgram(name);
        },
        getBuildButton: function (name) {
            var panels = this.manager.tab.planetPanels;

            for (var panel in panels) {
                for (var child in panels[panel].children) {
                    if (panels[panel].children[child].id === name) return panels[panel].children[child];
                }
            }
        }
    };

    // Crafting Manager
    // ================

    var CraftManager = function () {};

    CraftManager.prototype = {
        craft: function (name, amount) {
            amount = Math.floor(amount);

            if (!name || 1 > amount) return;
            if (!this.canCraft(name, amount)) return;

            var craft = this.getCraft(name);
            var ratio = game.getResCraftRatio(craft);

            game.craft(craft.name, amount);

            // determine actual amount after crafting upgrades
            amount = (amount * (ratio + 1)).toFixed(2);

            storeForSummary(name, amount, 'craft');
            activity('Kittens have crafted ' + game.getDisplayValueExt(amount) + ' ' + ucfirst(name), 'ks-craft');
        },
        canCraft: function (name, amount) {
            var craft = this.getCraft(name);
            var enabled = options.auto.craft.items[name].enabled;
            var result = false;

            if (craft.unlocked && enabled) {
                result = true;

                for (var i in craft.prices) {
                    var price = craft.prices[i];
                    var value = this.getValueAvailable(price.name);

                    if (value < price.val * amount) {
                        result = false;
                    }
                }
            }

            return result;
        },
        getCraft: function (name) {
            return game.workshop.getCraft(this.getName(name));
        },
        getLowestCraftAmount: function (name, limited) {
            var amount = Number.MAX_VALUE;
            var materials = this.getMaterials(name);

            // Safeguard if materials for craft cannot be determined.
            if (!materials) return 0;

            var res = this.getResource(name);

            for (var i in materials) {
				var delta = undefined;
				if (this.getResource(i).maxValue > 0 || ! limited) {
					// If there is a storage limit, we can just use everything returned by getValueAvailable, since the regulation happens there
                    delta = this.getValueAvailable(i) / materials[i];
				} else {
					// Take the currently present amount of material to craft into account
                    // Only craft "half" (TODO: document this behaviour)
                    delta = (this.getValueAvailable(i) - materials[i] * this.getValueAvailable(res.name)) / (2 * materials[i]);
                }	
                //var total = this.getValueAvailable(i) / materials[i];
                //amount = (amount === undefined || total < amount) ? total : amount;
				amount = Math.min(delta, amount);
            }

            // If we have a maximum value, ensure that we don't produce more than
            // this value. This should currently only impact wood crafting, but is
            // written generically to ensure it works for any craft that produces a
            // good with a maximum value.
            if (res.maxValue > 0 && amount > (res.maxValue - res.value))
                amount = res.maxValue - res.value;

            return Math.floor(amount);
        },
        getMaterials: function (name) {
            var materials = {};
            var craft = this.getCraft(name);

            // Safeguard against craft items that aren't actually available yet.
            if (!craft) return;

            var prices = craft.prices;

            for (var i in prices) {
                var price = prices[i];

                materials[price.name] = price.val;
            }

            return materials;
        },
        getName: function (name) {
            // adjust for spelling discrepancies in core game logic
            if ('catpower' === name) name = 'manpower';
            if ('compendium' === name) name = 'compedium';
            if ('concrete' === name) name = 'concrate';

            return name;
        },
        getResource: function (name) {
            for (var i in game.resPool.resources) {
                var res = game.resPool.resources[i];
                if (res.name === this.getName(name)) return res;
            }
            warning('unable to find resource ' + name);
            return null;
        },
        getValue: function (name) {
            return this.getResource(name).value;
        },
        getStock: function (name) {
            var res = options.auto.resources[this.getName(name)];
            var stock = res ? res.stock : 0;

            return !stock ? 0 : stock;
        },
        getValueAvailable: function (name, all) {
            var value = this.getValue(name);
            var stock = this.getStock(name);

            if ('catnip' === name) {
                var resPerTick = game.getResourcePerTick(name, false, {
                    modifiers: {
                        'catnip': 0.10 - game.calendar.getWeatherMod()
                    }});

                if (resPerTick < 0) stock -= resPerTick * 202 * 5;
            }

            value = Math.max(value - stock, 0);

            // If we have a maxValue, and user hasn't requested all, check
            // consumption rate
            if (!all && this.getResource(name).maxValue > 0) {
                var res = options.auto.resources[name];
                var consume = res && (res.consume != undefined) ? res.consume : options.consume;

                value *= consume;
            }

            return value;
        }
    };

    // Trading Manager
    // ===============

    var TradeManager = function () {
        this.craftManager = new CraftManager();
        this.manager = new TabManager('Trade');

        this.manager.render();
    };

    TradeManager.prototype = {
        craftManager: undefined,
        manager: undefined,
        trade: function (name, amount) {
			game.tabs[4].render(); // This should allow the trading to work without having to go to the tab first!
            if (!name || 1 > amount) return;

            var race = this.getRace(name);

            if (!race.unlocked) return;

            var button = this.getTradeButton(race.title);

            if (!button.model.enabled || !options.auto.trade.items[name].enabled) return;
			//for quick reference:
			// button= game.tabs[4].racePanels[1].tradeBtn;//1 for zebras (numbers depend on the number of species that are capable of being traded with unfortunately)
			// button= game.tabs[4].racePanels[2].tradeBtn;//for leviathans (3 species)
			// button= game.tabs[4].racePanels[game.tabs[4].racePanels.length-1].tradeBtn;// general leviathans location
			// Check this for leviathan trading (the button.model.enabled should give false if they are present hopefully)
			// The racePanel doesn't update until you go to the trade screen, so you'd have to visit every time the leviathans came back. Can we render it without visiting the tab?
			
			// Also try
			//to see if it updates the trade tab without having to click on it (before visiting the tab)::

			//game.tabs[4].render() <--This one works!
			
			//Also try game.tabs[4].render
			
			
			
			
			//game.diplomacy.get("leviathans").unlocked; will show if they arrived I think, but not if the button is available to trade
			
			
            game.diplomacy.tradeMultiple(race, amount);
            storeForSummary(name, amount, 'trade');
            activity('Kittens have traded ' + amount + 'x with ' + ucfirst(name), 'ks-trade');
        },
        getLowestTradeAmount: function (name) {
            var amount = undefined;
            var highestCapacity = undefined;
            var materials = this.getMaterials(name);
            var race = this.getRace(name);

            for (var i in materials) {
                var total = this.craftManager.getValueAvailable(i) / materials[i];

                amount = (amount === undefined || total < amount) ? total : amount;
            }

            if (race === null || options.auto.trade.items[name].allowcapped) return Math.floor(amount);

            // Loop through the items obtained by the race, and determine
            // which good has the most space left. Once we've determined this,
            // reduce the amount by this capacity. This ensures that we continue to trade
            // as long as at least one resource has capacity, and we never over-trade.
            for (var s in race.sells) {
                var item = race.sells[s];
                var resource = this.craftManager.getResource(item.name);
                var max = 0;

                // No need to process resources that don't cap
                if (!resource.maxValue) continue;

                // Zebras special cased titanium taken directly from game code
                if (race.name == "zebras" && item.name == "titanium") {
                    var val = 1.5 + (1.5 * game.resPool.get("ship").value / 100 * 2);
                    max = Math.ceil(val);
                } else {
                    var sratio = item.seasons[game.calendar.getCurSeason().name];
                    var tratio = game.getEffect("tradeRatio");
                    var val = item.value + item.value * tratio;

                    max = val * sratio * (1 + item.delta/2);
                }

                capacity = (resource.maxValue - resource.value) / max;

                highestCapacity = (capacity < highestCapacity) ? highestCapacity : capacity;
            }

            // We must take the ceiling of capacity so that we will trade as long
            // as there is any room, even if it doesn't have exact space. Otherwise
            // we seem to starve trading altogether.
            highestCapacity = Math.ceil(highestCapacity);

            // Now that we know the most we *should* trade for, check to ensure that
            // we trade for our max cost, or our max capacity, whichever is lower.
            // This helps us prevent trading for resources we can't store. Note that we
            // essentially ignore blueprints here. In addition, if highestCapacity was never set,
            // then we just
            amount = (highestCapacity < amount) ? highestCapacity : amount;

            return Math.floor(amount);
        },
        getMaterials: function (name) {
            var materials = {catpower: 50, gold: 15};

            if (name === undefined)
                return materials;

            var prices = this.getRace(name).buys;

            for (var i in prices) {
                var price = prices[i];

                materials[price.name] = price.val;
            }

            return materials;
        },
        getRace: function (name) {
            if (name === undefined)
                return null;
            else
                return game.diplomacy.get(name);
        },
        getTradeButton: function (race) {
            for (var i in this.manager.tab.racePanels) {
                var panel = this.manager.tab.racePanels[i];

                if (panel.name.indexOf(race) > -1) return panel.tradeBtn;
            }

            warning('unable to find trade button for ' + name);
        }
    };

    // ==============================
    // Configure overall page display
    // ==============================

    var container = $('#game');
    var column = $('.column');
    var body = $('body');
    var button = $('.btn.modern');
    var left = $('#leftColumn');
    var middle = $('#midColumn');
    var right = $('#rightColumn');

    var addRule = function (rule) {
        var sheets = document.styleSheets;
        sheets[0].insertRule(rule, 0);
    };

    if (game.colorScheme !== 'sleek') {
        container.css({
            fontFamily: 'monospace',
            fontSize: '12px',
            minWidth: '1300px',
            top: '32px'
        });

        body.css({
            fontFamily: 'monospace',
            fontSize: '12px'
        });

        button.css({
            fontFamily: 'monospace',
            fontSize: '12px',
            width: '290px'
        });

        column.css({
            minHeight: 'inherit',
            maxWidth: 'inherit',
            padding: '1%',
            margin: 0,
            overflowY: 'auto'
        });

        left.css({
            height: '92%',
            width: '26%'
        });

        middle.css({
            marginTop: '1%',
            height: '90%',
            width: '48%'
        });

        right.css({
            overflowY: 'scroll',
            height: '92%',
            width: '19%'
        });

        addRule('#gameLog .msg {'
            + 'display: block;'
            + '}');

        addRule('#gameLog {'
            + 'overflow-y: hidden !important;'
            + 'width: 100% !important;'
            + 'padding-top: 5px !important;'
            + '}');

        addRule('#resContainer .maxRes {'
            + 'color: #676766;'
            + '}');

        addRule('#game .btn {'
            + 'border-radius: 0px;'
            + 'font-family: monospace;'
            + 'font-size: 12px !important;'
            + 'margin: 0 5px 7px 0;'
            + 'width: 290px;'
            + '}');
		
		addRule('#game .map-viewport {'
            + 'height: 340px;'
            + 'max-width: 500px;'
            + 'overflow: visible;'
            + '}');

        addRule('#game .map-dashboard {'
            + 'height: 120px;'
            + 'width: 292px;'
            + '}');
			// JFModification
    } else {
		addRule('#resContainer .maxRes {'
            + 'color: #c1bdbd;'
            + '}');
			// endmodification
	};

    addRule('#ks-options ul {'
        + 'list-style: none;'
        + 'margin: 0 0 5px;'
        + 'padding: 0;'
        + '}');

    addRule('#ks-options ul:after {'
        + 'clear: both;'
        + 'content: " ";'
        + 'display: block;'
        + 'height: 0;'
        + '}');

    addRule('#ks-options ul li {'
        + 'display: block;'
        + 'float: left;'
        + 'width: 100%;'
        + '}');

	addRule('#ks-options #toggle-list-resources .stockWarn {'
        + 'color: ' + options.stockwarncolor + ';'
        + '}');
	
    // Local Storage
    // =============

    var kittenStorageVersion = 1;

    var kittenStorage = {
        version: kittenStorageVersion,
        items: {},
        resources: {},
        triggers: {}
    };

    var initializeKittenStorage = function () {
        $("#items-list-build, #items-list-craft, #items-list-trade").find("input[id^='toggle-']").each(function () {
            kittenStorage.items[$(this).attr("id")] = $(this).prop("checked");
        });

        saveToKittenStorage();
    };

    var saveToKittenStorage = function () {
        kittenStorage.resources = options.auto.resources;
        kittenStorage.triggers = {
            faith: options.auto.faith.trigger,
            hunt: options.auto.hunt.trigger,
            build: options.auto.build.trigger,
            space: options.auto.space.trigger,
            craft: options.auto.craft.trigger,
			crypto: options.auto.crypto.trigger,
            explore: options.auto.explore.trigger,
            trade: options.auto.trade.trigger//, //JFmod added comma...
			// JFmodification
			// calculator: options.auto.calculator.trigger
			// endmodification
        };
        localStorage['cbc.kitten-scientists'] = JSON.stringify(kittenStorage);
    };

    var loadFromKittenStorage = function () {
        var saved = JSON.parse(localStorage['cbc.kitten-scientists'] || 'null');
        if (saved && saved.version == kittenStorageVersion) {
            kittenStorage = saved;

            for (var item in kittenStorage.items) {
                var value = kittenStorage.items[item];
                var el = $('#' + item);
                var option = el.data('option');
                var name = item.split('-');

                el.prop('checked', value);

                if (name.length == 2) {
                    option.enabled = value;
                } else {
                    if (name[1] == 'limited') {
                        option.limited = value;
                    } else {
                        option[name[2]] = value;
                    }
                }
            }

            var list = $("#toggle-list-resources");
            for (var resource in kittenStorage.resources) {
                var res = kittenStorage.resources[resource];

                if ($('#resource-' + resource).length === 0) {
                    list.append(addNewResourceOption(resource));
                }
                if ('stock' in res) {
                    setStockValue(resource, res.stock);
                }
                if ('consume' in res) {
                    setConsumeRate(resource, res.consume);
                }
            }

            if (saved.triggers) {
                options.auto.faith.trigger = saved.triggers.faith;
                options.auto.hunt.trigger = saved.triggers.hunt;
                options.auto.build.trigger = saved.triggers.build;
                options.auto.space.trigger = saved.triggers.space;
                options.auto.craft.trigger = saved.triggers.craft;
                options.auto.trade.trigger = saved.triggers.trade;
				options.auto.crypto.trigger = saved.triggers.crypto;
                options.auto.explore.trigger = saved.triggers.explore;
				// JFModification
				// options.auto.calculator.trigger = saved.triggers.calculator;
				// $('#trigger-calculator')[0].title = options.auto.calculator.trigger;
				// endmodification

                $('#trigger-faith')[0].title = options.auto.faith.trigger;
                $('#trigger-hunt')[0].title = options.auto.hunt.trigger;
                $('#trigger-build')[0].title = options.auto.build.trigger;
                $('#trigger-space')[0].title = options.auto.space.trigger;
                $('#trigger-craft')[0].title = options.auto.craft.trigger;
                $('#trigger-trade')[0].title = options.auto.trade.trigger;
				$('#trigger-crypto')[0].title = options.auto.crypto.trigger;
            }

        } else {
            initializeKittenStorage();
        }
    };

    // Add options element
    // ===================

    var ucfirst = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    var roundToTwo = function (n) {
        return +(Math.round(n + "e+2") + "e-2")
    };

    var setStockWarning = function(name, value) {
        // simplest way to ensure it doesn't stick around too often; always do 
        // a remove first then re-add only if needed
        $("#resource-" + name).removeClass("stockWarn");

        var maxValue = game.resPool.resources.filter(i => i.name == name)[0].maxValue;
        if (value > maxValue && !(maxValue === 0)) $("#resource-" + name).addClass("stockWarn");
    }
	
    var setStockValue = function (name, value) {
        var n = Number(value);

        if (isNaN(n) || n < 0) {
            warning('ignoring non-numeric or invalid stock value ' + value);
            return;
        }

        if (!options.auto.resources[name]) options.auto.resources[name] = {};
        options.auto.resources[name].stock = n;
        $('#stock-value-' + name).text('Stock: ' + game.getDisplayValueExt(n));
		
		setStockWarning(name, n)
    };

    var setConsumeRate = function (name, value) {
        var n = parseFloat(value);

        if (isNaN(n) || n < 0.0 || n > 1.0) {
            warning('ignoring non-numeric or invalid consume rate ' + value);
            return;
        }

        if (!options.auto.resources[name]) options.auto.resources[name] = {};
        options.auto.resources[name].consume = n;
        $('#consume-rate-' + name).text('Consume: ' + n.toFixed(2));
    };

    var removeResourceControl = function (name) {
        delete options.auto.resources[name];
    };

    var addNewResourceOption = function (name, title) {
        var res = options.auto.resources[name];
        var stock = res && (res.stock != undefined) ? res.stock : 0;
        var consume = res && (res.consume != undefined) ? res.consume : options.consume;

        var container = $('<div/>', {
            id: 'resource-' + name,
            css: {display: 'inline-block', width: '100%'},
        });

        var label = $('<div/>', {
            id: 'resource-label-' + name,
            text: ucfirst(title ? title : name),
            css: {display: 'inline-block', width: '95px'},
        });

        var stock = $('<div/>', {
            id: 'stock-value-' + name,
            text: 'Stock: ' + game.getDisplayValueExt(stock),
            css: {cursor: 'pointer', display: 'inline-block', width: '80px'},
        });

        var consume = $('<div/>', {
            id: 'consume-rate-' + name,
            text: 'Consume: ' + consume.toFixed(2),
            css: {cursor: 'pointer', display: 'inline-block'},
        });

        var del = $('<div/>', {
            id: 'resource-delete-' + name,
            text: 'del',
            css: {cursor: 'pointer',
                display: 'inline-block',
                float: 'right',
                paddingRight: '5px',
                textShadow: '3px 3px 4px gray'},
        });

        container.append(label, stock, consume, del);
		
		if (res != undefined && res.stock != undefined) setStockWarning(name, res.stock);
		
        stock.on('click', function () {
            var value = window.prompt('Stock for ' + ucfirst(title ? title : name));
            if (value !== null) {
                setStockValue(name, value);
                saveToKittenStorage();
            }
        });

        consume.on('click', function () {
            var value = window.prompt('Consume rate for ' + ucfirst(title ? title : name));
            if (value !== null) {
                setConsumeRate(name, value);
                saveToKittenStorage();
            }
        });

        del.on('click', function () {
            if (window.confirm('Delete resource controls for ' + ucfirst(title ? title : name) + '?')) {
                container.remove();
                removeResourceControl(name);
                saveToKittenStorage();
            }
        });

        return container;
    };

    var getAvailableResourceOptions = function () {
        var items = [];

        for (var i in game.resPool.resources) {
            var res = game.resPool.resources[i];

            // Show only new resources that we don't have in the list and that are
            // visible. This helps cut down on total size.
            if (res.name && $('#resource-' + res.name).length === 0) {
                var item = $('<div/>', {
                    id: 'resource-add-' + res.name,
                    text: ucfirst(res.title ? res.title : res.name),
                    css: {cursor: 'pointer',
                        textShadow: '3px 3px 4px gray'},
                });

                // Wrapper function needed to make closure work
                (function (res, item) {
                    item.on('click', function () {
                        item.remove();
                        if (!options.auto.resources[res.name]) options.auto.resources[res.name] = {};
                        options.auto.resources[res.name].stock = 0;
                        options.auto.resources[res.name].consume = options.consume;
                        $('#toggle-list-resources').append(addNewResourceOption(res.name, res.title));
                    });
                })(res, item);

                items.push(item);
            }
        }

        return items;
    };

    var getResourceOptions = function () {
        var list = $('<ul/>', {
            id: 'toggle-list-resources',
            css: {display: 'none', paddingLeft: '20px'}
        });

        var add = $('<div/>', {
            id: 'resources-add',
            text: 'add resources',
            css: {cursor: 'pointer',
                display: 'inline-block',
                textShadow: '3px 3px 4px gray',
                borderBottom: '1px solid rgba(185, 185, 185, 0.7)' },
        });

        var clearunused = $('<div/>', {
            id: 'resources-clear-unused',
            text: 'clear unused',
            css: {cursor: 'pointer',
                display: 'inline-block',
                float: 'right',
                paddingRight: '5px',
                textShadow: '3px 3px 4px gray' },
        });

        clearunused.on('click', function () {
            for (var name in options.auto.resources) {
                // Only delete resources with unmodified values. Require manual
                // removal of resources with non-standard values.
                if (!options.auto.resources[name].stock &&
                    options.auto.resources[name].consume == options.consume ||
                    options.auto.resources[name].consume == undefined) {
                    $('#resource-' + name).remove();
                }
            }
        });

        allresources = $('<ul/>', {
            id: 'available-resources-list',
            css: {display: 'none', paddingLeft: '20px'}
        });

        add.on('click', function () {
            allresources.toggle();
            allresources.empty();
            allresources.append(getAvailableResourceOptions());
        });

        list.append(add, clearunused, allresources);

        // Add all the current resources
        for (var name in options.auto.resources) {
            list.append(addNewResourceOption(name));
        }

        return list;
    };

    var getToggle = function (toggleName, text) {
        var auto = options.auto[toggleName];
        var element = $('<li/>');

        var label = $('<label/>', {
            'for': 'toggle-' + toggleName,
            text: text
        });

        var input = $('<input/>', {
            id: 'toggle-' + toggleName,
            type: 'checkbox'
        });

        if (auto.enabled) {
            input.prop('checked', true);
        }

        // engine needs a custom toggle
        if (toggleName !== 'engine') {
            input.on('change', function () {
                if (input.is(':checked') && auto.enabled == false) {
                    auto.enabled = true;
                    message('Enabled Auto ' + ucfirst(text));
                } else if (input.not(':checked') && auto.enabled == true) {
                    auto.enabled = false;
                    message('Disabled Auto ' + ucfirst(text));
                }
            });
        }

        element.append(input, label);

        if (auto.items) {
            // Add a border on the element
            element.css('borderBottom', '1px  solid rgba(185, 185, 185, 0.7)');

            var toggle = $('<div/>', {
                css: {display: 'inline-block', float: 'right'}
            });

            var button = $('<div/>', {
                id: 'toggle-items-' + toggleName,
                text: 'items',
                css: {cursor: 'pointer',
                    display: 'inline-block',
                    paddingRight: '5px',
                    textShadow: '3px 3px 4px gray'}
            });

            toggle.append(button);

            var list = $('<ul/>', {
                id: 'items-list-' + toggleName,
                css: {display: 'none', paddingLeft: '20px'}
            });

            var disableall = $('<div/>', {
                id: 'toggle-all-items-' + toggleName,
                text: 'disable all',
                css: {cursor: 'pointer',
                    display: 'inline-block',
                    textShadow: '3px 3px 4px gray',
                    marginRight: '8px'}
            });

            disableall.on('click', function () {
                // can't use find as we only want one layer of checkboxes
                var items = list.children().children(':checkbox');
                items.prop('checked', false);
                items.change();
                list.children().children(':checkbox').change();
            });

            list.append(disableall);

            var enableall = $('<div/>', {
                id: 'toggle-all-items-' + toggleName,
                text: 'enable all',
                css: {cursor: 'pointer',
                    display: 'inline-block',
                    textShadow: '3px 3px 4px gray'}
            });

            enableall.on('click', function () {
                // can't use find as we only want one layer of checkboxes
                var items = list.children().children(':checkbox');
                items.prop('checked', true);
                items.change();
                list.children().children(':checkbox').change();
            });

            list.append(enableall);

            // fill out list with toggle items
            for (var itemName in auto.items) {
                if (toggleName === 'trade')
                    list.append(getTradeOption(itemName, auto.items[itemName]));
                else if (toggleName === 'craft')
                    list.append(getCraftOption(itemName, auto.items[itemName]));
                else
                    list.append(getOption(itemName, auto.items[itemName]));
            }

            button.on('click', function () {
                list.toggle();
            });

            element.append(toggle, list);

            // Add resource controls for crafting, sort of a hack
            if (toggleName === 'craft') {
                var resources = $('<div/>', {
                    id: 'toggle-resource-controls',
                    text: 'resources',
                    css: {cursor: 'pointer',
                        display: 'inline-block',
                        paddingRight: '5px',
                        textShadow: '3px 3px 4px gray'},
                });

                var resourcesList = getResourceOptions();

                // When we click the items button, make sure we clear resources
                button.on('click', function () {
                    resourcesList.toggle(false);
                });

                resources.on('click', function () {
                    list.toggle(false);
                    resourcesList.toggle();
                });

                toggle.prepend(resources);

                element.append(resourcesList);
            }

        }

        if (auto.trigger) {
            var triggerButton = $('<div/>', {
                id: 'trigger-' + toggleName,
                text: 'trigger',
                title: auto.trigger,
                css: {cursor: 'pointer',
                    display: 'inline-block',
                    float: 'right',
                    paddingRight: '5px',
                    textShadow: '3px 3px 4px gray'}
            });

            triggerButton.on('click', function () {
				var value;
				if (text == 'Crypto'){value = window.prompt('Enter a new trigger value for ' + text + '. Corresponds to the amount of Relics needed before the exchange is made.', auto.trigger);}
                else{value = window.prompt('Enter a new trigger value for ' + text + '. Should be in the range of 0 to 1.', auto.trigger);}

				if (value !== null) {
                    auto.trigger = parseFloat(value);
                    saveToKittenStorage();
                    triggerButton[0].title = auto.trigger;
                }
            });

            element.append(triggerButton);
        }

        return element;
    };

    var getTradeOption = function (name, option) {
        var element = getOption(name, option);
        element.css('borderBottom', '1px solid rgba(185, 185, 185, 0.7)');

        var button = $('<div/>', {
            id: 'toggle-seasons-' + name,
            text: 'seasons',
            css: {cursor: 'pointer',
                display: 'inline-block',
                float: 'right',
                paddingRight: '5px',
                textShadow: '3px 3px 4px gray'},
        });

        var list = $('<ul/>', {
            id: 'seasons-list-' + name,
            css: {display: 'none', paddingLeft: '20px'}
        });

        // fill out the list with seasons
        list.append(getSeason(name, 'spring', option));
        list.append(getSeason(name, 'summer', option));
        list.append(getSeason(name, 'autumn', option));
        list.append(getSeason(name, 'winter', option));

        button.on('click', function () {
            list.toggle();
        });

        element.append(button, list);

        return element;
    };

    var getSeason = function (name, season, option) {
        var element = $('<li/>');

        var label = $('<label/>', {
            'for': 'toggle-' + name + '-' + season,
            text: ucfirst(season)
        });

        var input = $('<input/>', {
            id: 'toggle-' + name + '-' + season,
            type: 'checkbox'
        }).data('option', option);

        if (option[season]) {
            input.prop('checked', true);
        }

        input.on('change', function () {
            if (input.is(':checked') && option[season] == false) {
                option[season] = true;
                message('Enabled trading with ' + ucfirst(name) + ' in the ' + ucfirst(season));
            } else if (input.not(':checked') && option[season] == true) {
                option[season] = false;
                message('Disabled trading ' + ucfirst(name) + ' in the ' + ucfirst(season));
            }
            kittenStorage.items[input.attr('id')] = option[season];
            saveToKittenStorage();
        });

        element.append(input, label);

        return element;
    };

    var getOption = function (name, option) {
        var element = $('<li/>');
        var elementLabel = option.label || ucfirst(name);

        var label = $('<label/>', {
            'for': 'toggle-' + name,
            text: elementLabel,
            css: {display: 'inline-block', minWidth: '80px'}
        });

        var input = $('<input/>', {
            id: 'toggle-' + name,
            type: 'checkbox'
        }).data('option', option);

        if (option.enabled) {
            input.prop('checked', true);
        }

        input.on('change', function () {
            if (input.is(':checked') && option.enabled == false) {
                option.enabled = true;
                message('Enabled Auto ' + elementLabel);
            } else if (input.not(':checked') && option.enabled == true) {
                option.enabled = false;
                message('Disabled Auto ' + elementLabel);
            }
            kittenStorage.items[input.attr('id')] = option.enabled;
            saveToKittenStorage();
        });

        element.append(input, label);

        return element;
    };

    var getCraftOption = function (name, option) {
        var element = getOption(name, option);

        var label = $('<label/>', {
            'for': 'toggle-limited-' + name,
            text: 'Limited'
        });

        var input = $('<input/>', {
            id: 'toggle-limited-' + name,
            type: 'checkbox'
        }).data('option', option);

        if (option.limited) {
            input.prop('checked', true);
        }

        input.on('change', function () {
            if (input.is(':checked') && option.limited == false) {
                option.limited = true;
                message('Crafting ' + ucfirst(name) + ': limited once per season');
            } else if (input.not(':checked') && option.limited == true) {
                option.limited = false;
                message('Crafting ' + ucfirst(name) + ': unlimited');
            }
            kittenStorage.items[input.attr('id')] = option.limited;
            saveToKittenStorage();
        });

        element.append(input, label);

        return element;
    };
	
	// Grab button labels for religion options.
	var religionManager = new ReligionManager();
	for (var buildOption in options.auto.faith.items) {
		var buildItem = options.auto.faith.items[buildOption];
		var build = religionManager.getBuild(buildItem.name || buildOption);
		if (build) {
			options.auto.faith.items[buildOption].label = build.label;
		}
	}
	
    // Grab button labels for build options
    var buildManager = new BuildManager();
    for (var buildOption in options.auto.build.items) {
        var buildItem = options.auto.build.items[buildOption];
        var build = buildManager.getBuild(buildItem.name || buildOption);
        if (build) {
            if ("stage" in buildItem) {
                options.auto.build.items[buildOption].label = build.meta.stages[buildItem.stage].label;
            } else {
                options.auto.build.items[buildOption].label = build.meta.label;
            }
        }
    }
    // Grab button labels for space options
    var spaceManager = new SpaceManager();
    for (var spaceOption in options.auto.space.items) {
        var build = spaceManager.getBuild(spaceOption);
        if (build) {
            // It's changed to label in 1.3.0.0
            var title = build.title ? build.title : build.label;
            options.auto.space.items[spaceOption].label = title;
        }
    }

    var optionsElement = $('<div/>', {id: 'ks-options', css: {marginBottom: '10px'}});
    var optionsListElement = $('<ul/>');
    var optionsTitleElement = $('<div/>', {
        css: { bottomBorder: '1px solid gray', marginBottom: '5px' },
        text: version
    });

    optionsElement.append(optionsTitleElement);

    optionsListElement.append(getToggle('engine',   'Enable Scientists'));
    optionsListElement.append(getToggle('build',    'Building'));
    optionsListElement.append(getToggle('space',    'Space'));
    optionsListElement.append(getToggle('craft',    'Crafting'));
    optionsListElement.append(getToggle('trade',    'Trading'));
    optionsListElement.append(getToggle('hunt',     'Hunting'));
	optionsListElement.append(getToggle('faith',    'Religion'));
    optionsListElement.append(getToggle('festival', 'Festival'));
	optionsListElement.append(getToggle('crypto',   'Crypto'));
    optionsListElement.append(getToggle('explore',  'Explore'));
	// JFmodification
	optionsListElement.append(getToggle('UniCalc','CalcUnis'));
	
	// endmodification

    // add activity button
    // ===================

    activitySummary = {};
    var resetActivitySummary = function () {
        activitySummary = {
            lastyear: game.calendar.year,
            lastday:  game.calendar.day,
            craft:    {},
            trade:    {},
            build:    {},
            other:    {}
        };
    };

    var storeForSummary = function (name, amount, section) {
        if (amount === undefined) amount = 1;
        if (section === undefined) section = 'other';

        if (activitySummary[section] === undefined)
            activitySummary[section] = {};

        if (activitySummary[section][name] === undefined) {
            activitySummary[section][name] = parseInt(amount, 10);
        } else {
            activitySummary[section][name] += parseInt(amount, 10);
        }
    };

    var displayActivitySummary = function () {
        // Festivals
        if (activitySummary.other.festival) {
            summary('Held ' + game.getDisplayValueExt(activitySummary.other.festival) + ' festivals');
        }

        // Observe stars
        if (activitySummary.other.stars) {
            summary('Observed ' + game.getDisplayValueExt(activitySummary.other.stars) + ' stars');
        }

        // Praise the Sun
        if (activitySummary.other.faith) {
            summary('Accumulated ' + game.getDisplayValueExt(activitySummary.other.faith) + ' by praising the sun');
        }

        // Hunters
        if (activitySummary.other.hunt) {
            summary('Sent ' + game.getDisplayValueExt(activitySummary.other.hunt) + ' adorable kitten hunter' + (activitySummary.other.hunt == 1 ? '' : 's'));
        }

        // Buildings
        for (var name in activitySummary.build) {
            summary('Built: +' + game.getDisplayValueExt(activitySummary.build[name]) + ' ' + ucfirst(name));
        }

        // Crafts
        for (var name in activitySummary.craft) {
            summary('Crafted: +' + game.getDisplayValueExt(activitySummary.craft[name]) + ' ' + ucfirst(name));
        }

        // Trading
        for (var name in activitySummary.trade) {
            summary('Traded: ' + game.getDisplayValueExt(activitySummary.trade[name]) + 'x ' + ucfirst(name));
        }

        // Show time since last run. Assumes that the day and year are always higher.
        if (activitySummary.lastyear && activitySummary.lastday) {
            var years = game.calendar.year - activitySummary.lastyear;
            var days = game.calendar.day - activitySummary.lastday;

            if (days < 0) {
                years -= 1;
                days += 400;
            }

            var duration = '';
            if (years > 0) {
                duration += years + ' ';
                duration += (years == 1) ? 'year' : 'years';
            }

            if (days >= 0) {
                if (years > 0) duration += ' and ';
                duration += roundToTwo(days) + ' ';
                duration += (days == 1) ? 'day' : 'days';
            }

            summary('Summary of the last ' + duration);
        }

        // Clear out the old activity
        resetActivitySummary()
    };

    resetActivitySummary();

    var activityBox = $('<div/>', {
        id: 'activity-box',
        css: {
            display: 'inline-block',
            float: 'right',
            verticalAlign: 'top'
        }
    });

    var showActivity = $('<a/>', {
        id: 'showActivityHref',
        text: 'Show activity',
        href: '#',
        css: {
            verticalAlign: 'top'
        }
    });

    var activityCheckbox = $('<input/>', {
        id: 'enable-activity',
        type: 'checkbox',
        css: {
            verticalAlign: 'top'
        }
    });

    var activityLabel = $('<label/>', {
        for: 'enable-activity'
    });

    if (options.showactivity)
        activityCheckbox.prop('checked', true);

    activityCheckbox.on('change', function () {
        if (activityCheckbox.is(':checked') && options.showactivity == false) {
            options.showactivity = true;
            message('Showing Kitten Scientists activity live');
        } else if (activityCheckbox.not(':checked') && options.showactivity == true) {
            options.showactivity = false;
            message('Hiding updates of Kitten Scientists activity');
        }
    });

    showActivity.on('click', displayActivitySummary);

    activityBox.append(activityCheckbox, activityLabel, showActivity);

    $('#clearLog').append(activityBox);


    // add the options above the game log
    right.prepend(optionsElement.append(optionsListElement));

    // Initialize and set toggles for Engine
    // =====================================

    var engine = new Engine();
    var toggleEngine = $('#toggle-engine');

    toggleEngine.on('change', function () {
        if (toggleEngine.is(':checked')) {
            engine.start();
        } else {
            engine.stop();
        }
    });

    loadFromKittenStorage();

    if (console && console.log) console.log(version + " loaded");

}

var loadTest = function() {
    if (typeof gamePage === 'undefined') {
        // Test if kittens game is already loaded or wait 2s and try again
        setTimeout(function(){
            loadTest();
        }, 2000);
    } else {
        // Kittens loaded, run Kitten Scientist's Automation Engine
        game = gamePage;
        run();
    }
}
 
loadTest();
