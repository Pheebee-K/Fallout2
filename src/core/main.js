"use strict";

window.addEventListener("load", main_init);

function main_init()
{
	// Test for browser compatibility.
	if(!browser_test()) {
		throw new Error("Browser failed compatibility test");
	}

	_canvas = document.getElementById('mainCanvas');
	_canvas.style.cursor = "none";

	document.getElementById("main").style.width = SCREEN_WIDTH;

	_canvas.width = SCREEN_WIDTH;
	_canvas.height = SCREEN_HEIGHT;

	_context = _canvas.getContext("2d");
	_context.imageSmoothingEnabled = false;

	document.addEventListener('mousemove', main_input);	// add input listeners
	_canvas.addEventListener('mousedown', main_input);
	_canvas.addEventListener('mouseup', main_input);
	_canvas.addEventListener('click',main_input);
	_canvas.addEventListener('contextmenu',main_input);

	document.addEventListener('keydown', main_input);	// declare at document scope
	document.addEventListener('keyup', main_input);

	var main_loop = function() {
		main_update();
		main_render();
		CALLFRAME(main_loop);
	};

	if(!CALLFRAME) {
		throw new Error("No frame handler!");
	}

	mainState = new MainState();
	loadState = new LoadState();
	mainLoadState = new MainLoadState();
	mainMenuState = new MainMenuState();
	ingameMenuState = new IngameMenuState();	// init in mainState
	skilldexState = new SkilldexState();
	contextMenuState = new ContextMenuState();
	inventoryState = new InventoryState();
	characterScreenState = new CharacterScreenState();
	pipboyState = new PipboyState();
	mapScreenState = new MapScreenState();

	CALLFRAME(main_loop);	// init loop
	_canvas.focus();

	activeGameStates.push(mainLoadState);
	mainLoadState.init();
	mainState.console.print("Welcome to jsFO!");
};


function main_menu() {
	main_gameStateFunction('closeIngameMenu');

	let mainLoadState_index = activeGameStates.indexOf(mainLoadState);
	if(mainLoadState_index > -1) {	//	remove mainState
		activeGameStates.splice(mainLoadState_index,1);
	}

	let loadState_index = activeGameStates.indexOf(loadState);
	if(loadState_index > -1) {	//	remove mainState
		activeGameStates.splice(loadState_index,1);
	}

	let mainState_index = activeGameStates.indexOf(mainState);
	if(mainState_index > -1) {	//	remove mainState
		activeGameStates.splice(mainState_index,1);
	}

	activeGameStates.push(mainMenuState);
};


function main_input(e) {
	e.preventDefault();

	switch(e.type) {
		case "mousemove":
			clientBoundingRect = _canvas.getBoundingClientRect();
			_mouse.x = (e.clientX - clientBoundingRect.left)|0;
			_mouse.y = (e.clientY - clientBoundingRect.top)|0;
			break;
		case "mousedown":
			_mouse[e.button] = true;
			break;
		case "mouseup":
			_mouse[e.button] = false;
			break;
		case "keydown":
			_keyboard[e.code] = true;
			break;
		case "keyup":
			_keyboard[e.code] = false;
			break;
		case "click":
			break;
	};

	for(let i = 0; i < activeGameStates.length; i++) {
		if(!activeGameStates[i].statePause) activeGameStates[i].input.call(activeGameStates[i],e);
	}

	return false;
};


function main_update() {
	fps_currentTime = Date.now();

	for(let i = 0; i < activeGameStates.length; i++) {
		if(!activeGameStates[i].statePause) activeGameStates[i].update.call(activeGameStates[i]);
	}

};


function main_render() {
	_canvas.width = SCREEN_WIDTH;	// hack clear

	for(let i = 0; i < activeGameStates.length; i++) {
		activeGameStates[i].render.call(activeGameStates[i]);
	}

};


function main_loadGame(_saveState) {
	main_gameStateFunction('closeIngameMenu');

	let mainMenuState_index = activeGameStates.indexOf(mainMenuState);
	if(mainMenuState_index > -1) {	//	remove mainState
		activeGameStates.splice(mainMenuState_index,1);
	}

	let mainState_index = activeGameStates.indexOf(mainState);
	if(mainState_index > -1) {	//	remove mainState
		activeGameStates.splice(mainState_index,1);
	}

	let loadState_index = activeGameStates.indexOf(loadState);
	if(loadState_index > -1) {	//	remove mainState
		activeGameStates.splice(loadState_index,1);
	}

	activeGameStates.push(loadState);
	loadState.init(_saveState);
};


function main_openActiveState(state) {
	mainState.statePause = true;
	activeGameStates.push(state);
	_keyboard['Escape'] = false;	// LOL - sets ESC key state to false to prevent the next iteration of the gamestate stack from capturing the input.
};

function main_closeActiveState(state) {
	if(mainState.statePause) mainState.statePause = false;
	let statePosition = activeGameStates.indexOf(state);
	if(statePosition) {
		activeGameStates.splice(activeGameStates.indexOf(state),1);
	} else {
		console.log("main_closeActiveState: Invalid state");
	}
};


function main_gameStateFunction(f, options) {
	switch(f) {

		case "main_initGameState":
			mainState.loadSaveState(options.saveState);
			activeGameStates.splice(activeGameStates.indexOf(loadState),1);
			activeGameStates.push(mainState);
			break;

		case "main_loadGameState":
			break;

		case "mainMenu_newGame":
			main_loadGame(newGame);
			break;

		case "openContextMenu":
			contextMenuState.setMenuItems(options.obj,
				options.x,
				options.y);
			main_openActiveState(contextMenuState);
			break;
		case "closeContextMenu":
			main_closeActiveState(contextMenuState);
			break;
		case "openInventory":
			main_openActiveState(inventoryState);
			break;
		case "closeInventory":
			main_closeActiveState(inventoryState);
			break;
		case "openIngameMenu":
			main_openActiveState(ingameMenuState);
			break;
		case "closeIngameMenu":
			main_closeActiveState(ingameMenuState);
			break;
		case "openSkilldex":
			main_closeActiveState(skilldexState);
			break;
		case "openCharacterScreen":
			main_openActiveState(characterScreenState);
			break;
		case "closeCharacterScreen":
			main_closeActiveState(characterScreenState);
			break;
		case "openPipBoy":
			main_openActiveState(pipboyState);
			break;
		case "closePipBoy":
			main_closeActiveState(pipboyState);
			break;
		case "openMap":
			main_openActiveState(mapScreenState);
			break;
		case "closeMap":
			main_closeActiveState(mapScreenState);
			break;
		default:
			console.log('main_gameStateFunction: improper arguments supplied');
			break;
	}
};


function main_payloadError(error) {
	console.log(error);
};

function main_loadJsonPayload(url) {
	return new Promise((resolve, reject) => {
		let payloadXHR = new XMLHttpRequest();

		payloadXHR.onload = function() {
			resolve(this.response);
		};

		payloadXHR.onerror = function() {
			reject(this.statusText);
		};

		payloadXHR.open("GET", url, true);
		payloadXHR.responseType = 'json';
		payloadXHR.send();
	});
};
