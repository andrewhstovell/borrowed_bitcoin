// SET UP THE GAME ENVIRONMENT
// Disable WebGL Aliasing
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const site = document.getElementById('site');
const gameContainer = document.getElementById('game');
const canvas = document.getElementById('canvas');

var game = {
  viewPortWidth: gameContainer.clientWidth,
  viewPortHeight: gameContainer.clientHeight,
  worldWidth:  2560,
  worldHeight: 1440,
  delta: 0
};

var HQLocation = {x:game.viewPortWidth/2, y:game.viewPortHeight/2};

// Game State Variables
var state = {
  playerBalance: 0.0001,
  gpuValue: 0.0001,
  gpusAvailable: 4,
  gpuArray: [],
  movementSpeed: 1,
  gpuOnboard: false,
  pickUpRange: 50,
  scanCooldown: 0,
  cooldownRate: 0.01,
  cooldownTime: 3, //sec
  scanDiameter: 400, //px
  upgradeCost: [
    0.0008,
    0.0006,
    0.0004,
    0.0003,
    0.0002
  ]
};

// Create the main rendering view
const renderer = new PIXI.Renderer({
  width: game.viewPortWidth, height: game.viewPortHeight,
  view: canvas,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  backgroundColor: 0x43A080
});

// Create the main game Stage
const stage = new PIXI.Container();

// Allow resizing of window
window.addEventListener('resize', resize);
function resize() {
     renderer.resize(game.viewPortWidth, game.viewPortHeight);
}

// LOAD TEXT STYLES
const balanceStyle = new PIXI.TextStyle({
  fill: "white",
  fontFamily: "Helvetica",
  fontVariant: "small-caps",
  fontSize: 40,
  fontWeight: "bold"
});

const buttonDescriptionStyle = new PIXI.TextStyle({
  fill: "black",
  fontFamily: "Helvetica",
  fontStyle: "italic",
  fontVariant: "small-caps",
  fontSize: 14,
  fontWeight: "bold"
});

const buttonCurrentValueStyle = new PIXI.TextStyle({
  fill: "#3cc039", // green
  fontFamily: "Helvetica",
  fontSize: 13,
  fontStyle: "italic",
  fontVariant: "small-caps",
  fontWeight: "bold"
});

const buttonCostStyle = new PIXI.TextStyle({
  fill: "#e6a00a", // orange
  fontFamily: "Helvetica",
  fontSize: 13,
  fontStyle: "italic",
  fontVariant: "small-caps",
  fontWeight: "bold"
});

// LOAD TEXTURES
const droneTextures = [
  PIXI.Texture.from('./assets/drone1.png'), PIXI.Texture.from('./assets/drone2.png'),
  PIXI.Texture.from('./assets/drone3.png'), PIXI.Texture.from('./assets/drone4.png')
];
const upgradeButtonTexture = PIXI.Texture.from('./assets/button.png');
const upgradeButtonHoverTexture = PIXI.Texture.from('./assets/button_hover.png');
const upgradeButtonDownTexture = PIXI.Texture.from('./assets/button_down.png');
const warningTexture = PIXI.Texture.from('./assets/warning.png');
const crateTexture = PIXI.Texture.from('./assets/crate.png');
const bitcoinLogoTexture = PIXI.Texture.from('./assets/bitcoin_logo.png');
const gpuTexture = PIXI.Texture.from('./assets/gpu.png');
const cityTexture = PIXI.Texture.from('./assets/map.png');
const HQHighlightTexture = PIXI.Texture.from('./assets/hq_highlight.png');
const scannerTexture = PIXI.Texture.from('./assets/scan.png');
const tutorialTexture = PIXI.Texture.from('./assets/help.png');
const radarEmptyTexture = PIXI.Texture.from('./assets/radar1.png');
const radarFullTexture = PIXI.Texture.from('./assets/radar2.png');

// Create Player Balance Text
var balanceText = new PIXI.Text("" + state.playerBalance, balanceStyle);
balanceText.position.set(80, 14);

// CREATE AND CONFIGURE SPRITES
// Drone
const drone = new PIXI.Sprite(droneTextures[0]);
drone.anchor.set(0.5);
drone.position.set(game.viewPortWidth / 2, game.viewPortHeight / 2);
let droneLeft = 0, droneRight = 0, droneUp = 0, droneDown = 0; // current movement
const origDroneWidth = drone.width;
const origDroneHeight = drone.height;
const movementScalar = 0.85; // For scaling the drones texture during movement
const turningRotation = 0.1; // For rotating the drones texture during movement
let droneScalar = 0;

// Out-of-bounds Warning
const warning = new PIXI.Sprite(warningTexture);
warning.anchor.set(0.5);
warning.position.set(game.viewPortWidth / 2, drone.x - 50);
let warningVisable = false;

// Crate (Collected GPU)
const crate = new PIXI.Sprite(crateTexture);
crate.anchor.set(0.5);

// Bitcoin Logo
const bitcoinLogo = new PIXI.Sprite(bitcoinLogoTexture);
bitcoinLogo.position.set(5, 5);

// City
const city = new PIXI.Sprite(cityTexture);
city.anchor.set(0.5);
city.position.set(game.viewPortWidth / 2, game.viewPortHeight / 2);

// HQ Highlight Box
const hqHighlight = new PIXI.Sprite(HQHighlightTexture);
hqHighlight.anchor.set(0.5);
hqHighlight.position.set(city.x, city.y);

// Scanner Pulse
const scanner = new PIXI.Sprite(scannerTexture);
scanner.anchor.set(0.5);
let currentScannerScale = 0;
let scanning = false;

// Tutorial Instructions
const tutorial = new PIXI.Sprite(tutorialTexture);
tutorial.anchor.set(0.5, 1);
tutorial.position.set(game.viewPortWidth / 2, game.viewPortHeight);
let tutorialShowing = true;

// Radar Indicator
const radar = new PIXI.Sprite(radarFullTexture);
radar.anchor.set(0.5);
radar.position.set(40, game.viewPortHeight - 40);

// SETUP EVENT LISTNERS
// Listen for Key Presses
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') {
    droneUp = -state.movementSpeed;
    drone.height = origDroneHeight * movementScalar;
    return;
  }

  if (event.key === 's') {
    droneDown = state.movementSpeed;
    drone.height = origDroneHeight * movementScalar;
    return;
  }

  if (event.key === 'a') {
    droneLeft = -state.movementSpeed;
    drone.width = origDroneWidth * movementScalar;
    drone.rotation = -turningRotation;
    return;
  }

  if (event.key === 'd') {
    droneRight = state.movementSpeed;
    drone.width = origDroneWidth * movementScalar;
    drone.rotation = turningRotation;
    return;
  }

  if (event.key === 'z') {
    scan();
    return;
  }
}, false);

// Listen for Key Releases
document.addEventListener('keyup', (event) => {
  if (event.key === 'w') {
    droneUp = 0;
    drone.height = origDroneHeight;
    return;
  }

  if (event.key === 's') {
    droneDown = 0;
    drone.height = origDroneHeight;
    return;
  }

  if (event.key === 'a') {
    droneLeft = 0;
    drone.width = origDroneWidth;
    drone.rotation = 0;
    return;
  }

  if (event.key === 'd') {
    droneRight = 0;
    drone.width = origDroneWidth;
    drone.rotation = 0;
    return;
  }

}, false);

const ticker = new PIXI.Ticker();
ticker.add(onUpdate);
ticker.start();

// Add sprites to stage
stage.addChild(city);
stage.addChild(drone);
stage.addChild(tutorial);
stage.addChild(radar);
stage.addChild(bitcoinLogo);
stage.addChild(balanceText);

// Create upgrade buttons
const buttons = [];
const buttonCurrentValueTexts = [
  new PIXI.Text(state.gpusAvailable, buttonCurrentValueStyle),
  new PIXI.Text(state.movementSpeed, buttonCurrentValueStyle),
  new PIXI.Text(state.scanDiameter, buttonCurrentValueStyle),
  new PIXI.Text(state.cooldownTime + 's', buttonCurrentValueStyle),
  new PIXI.Text(state.pickUpRange, buttonCurrentValueStyle)
];

const upgradeCostOriginal = [
  0.0008,
  0.0006,
  0.0004,
  0.0003,
  0.0002
];

const upgradeCostTexts = [
  new PIXI.Text(state.upgradeCost[0] + " BTC", buttonCostStyle),
  new PIXI.Text(state.upgradeCost[1] + " BTC", buttonCostStyle),
  new PIXI.Text(state.upgradeCost[2] + " BTC", buttonCostStyle),
  new PIXI.Text(state.upgradeCost[3] + " BTC", buttonCostStyle),
  new PIXI.Text(state.upgradeCost[4] + " BTC", buttonCostStyle)
];

buttonDescriptors = [
  "GPU's in world' +1",
  "Drone Speed +0.05",
  "Scan Range +10",
  "Scan Cooldown -0.1s",
  "Pick Up Range +1"
];

for (let i = 0; i < buttonDescriptors.length; i++) {
  const button = new PIXI.Sprite(upgradeButtonTexture);

  button.anchor.x = 1;
  button.position.set(game.viewPortWidth, i * 48);

  // make the button interactive
  button.interactive = true;
  button.buttonMode = true;

  button
  .on('mousedown', onButtonDown)
  .on('mouseup', onButtonUp)
  .on('mouseupoutside', onButtonUp)
  .on('mouseover', onButtonOver)
  .on('mouseout', onButtonOut)

  // add it to the stage and array
  stage.addChild(button);
  buttons.push(button);

  // Set upgrade description texts
  var text = new PIXI.Text(buttonDescriptors[i], buttonDescriptionStyle);
  text.position.set(game.viewPortWidth - 155, 5 + i * 48);
  stage.addChild(text);

  // Set upgrade current value texts
  buttonCurrentValueTexts[i].position.set(game.viewPortWidth - 155, 22 + i * 48);
  stage.addChild(buttonCurrentValueTexts[i]);

  // Set upgrade cost texts
  upgradeCostTexts[i].anchor.x = 1;
  upgradeCostTexts[i].position.set(game.viewPortWidth - 2, 22 + i * 48);
  stage.addChild(upgradeCostTexts[i]);
}

function onButtonDown() {
  this.isdown = true;
  this.texture = upgradeButtonDownTexture;
  this.alpha = 1;
}

function onButtonUp() {
  this.isdown = false;
  if (this.isOver) {
      this.texture = upgradeButtonHoverTexture;
      // determine the index of the button pressed
      let buttonID = 0;
      for (let i = 0; i < buttons.length; i++){
        if (this === buttons[i]) {
          buttonID = i;
        }
      }

      if (state.playerBalance >= state.upgradeCost[buttonID]) {
        switch (buttonID) {
          case 0:
            state.gpusAvailable++;
            placeGpu();
            buttonCurrentValueTexts[buttonID].text = state.gpusAvailable;
            break;
          case 1:
            state.movementSpeed += 0.05;
            buttonCurrentValueTexts[buttonID].text = state.movementSpeed.toFixed(2);
            break;
          case 2:
            state.scanDiameter += 10;
            buttonCurrentValueTexts[buttonID].text = state.scanDiameter;
            break;
          case 3:
            state.cooldownTime -= 0.1;
            buttonCurrentValueTexts[buttonID].text = state.cooldownTime.toFixed(1) + 's';
            break;
          case 4:
            state.pickUpRange++;
            buttonCurrentValueTexts[buttonID].text = state.pickUpRange;
            break;
        }
        updateBalance(-state.upgradeCost[buttonID]);
        state.upgradeCost[buttonID] += upgradeCostOriginal[buttonID];
        upgradeCostTexts[buttonID].text = state.upgradeCost[buttonID].toFixed(4) + " BTC";
        
      }
  } else {
      this.texture = upgradeButtonTexture;
  }
}

function onButtonOver() {
  this.isOver = true;
  if (this.isdown) {
      return;
  }
  this.texture = upgradeButtonHoverTexture;
}

function onButtonOut() {
  this.isOver = false;
  if (this.isdown) {
      return;
  }
  this.texture = upgradeButtonTexture;
}

// Place the starter Gpu's
for (let i = 0; i < state.gpusAvailable; i++) {
  placeGpu();
}

function onUpdate() {
    game.delta += 0.1;

    // Ensure that the drone cannot leave the city bounds
    if (drone.x > city.x + city.width / 2 || drone.x < city.x - city.width / 2
      || drone.y > city.y + city.height / 2 || drone.y < city.y - city.height / 2 ) {
        
        warningVisable = true;
        stage.addChild(warning);
        moveTowardCenter(city);
        moveTowardCenter(HQLocation);
        moveTowardCenter(hqHighlight);
        state.gpuArray.forEach(function(gpu) {
          moveTowardCenter(gpu);
        });
    } else {
      updateRelativePosition(city);
      updateRelativePosition(HQLocation);
      updateRelativePosition(hqHighlight);
      state.gpuArray.forEach(function(gpu) {
        updateRelativePosition(gpu);
  
        if (stage.children.includes(gpu)){
          // Animate the gpu bobbing
          gpu.y = gpu.y + Math.sin(game.delta/2) * .3;
  
          if (distanceBetween(gpu, drone) <= state.pickUpRange &&
              state.gpuOnboard == false){
                loadOntoDrone(gpu);
          }
        }
      });

      warningVisable = false;
      stage.removeChild(warning);
    }

    if (state.gpuOnboard){
      crate.x = drone.x;
      crate.y = drone.y;

      if (distanceBetween(drone, HQLocation) < 100){
        offloadFromDrone();
      }
    }

    if (warningVisable == true){
      warning.scale.set(Math.sin(game.delta/2) + 1, Math.sin(game.delta/2) + 1)
    }

    // Animate the drones props
    drone.texture = droneTextures[Math.floor(game.delta * 6) % 4];

    // Animate the drone sway
    drone.x = drone.x + Math.sin(game.delta/3) * 0.25;

    if (tutorialShowing) {
      tutorial.y = game.viewPortHeight - 20 + Math.sin(game.delta) * 10;
    }

    if (droneScalar < 1){
      droneScalar += 0.003;
    } else if (tutorialShowing) {
        tutorialShowing = false;
        stage.removeChild(tutorial);
    }

    if (state.scanCooldown > 0){
      state.scanCooldown -= state.cooldownRate;
    } else {
      radar.texture = radarFullTexture;
    }

    radar.rotation += .01;

    if (scanning) {
      currentScannerScale += state.cooldownRate + 0.002;
      scanner.scale.set(currentScannerScale, currentScannerScale);
      if (currentScannerScale * scanner.texture.width > state.scanDiameter) {
        scanning = false;
        stage.removeChild(scanner);
      }
    }

    radar.scale.set(1 - (state.scanCooldown/state.cooldownTime), 1 - (state.scanCooldown/state.cooldownTime));
    drone.scale.set(droneScalar, droneScalar);
    hqHighlight.scale.set(Math.sqrt(Math.pow(Math.sin(game.delta/3)/6+1.2,2)), Math.sqrt(Math.pow(Math.sin(game.delta/3)/6+1.2,2)));
    renderer.render(stage);
}

function placeGpu() {
  let buffer = 100;
  let x = getRandomInt(game.worldWidth - buffer);
  let y = getRandomInt(game.worldHeight - buffer - 300); // 300 prevents Gpu's spawning in water

  const gpu = new PIXI.Sprite(gpuTexture);
  gpu.anchor.set(0.5);

  gpu.x = (city.x - game.worldWidth / 2) + (buffer / 2) + x;
  gpu.y = (city.y - game.worldHeight / 2 ) + (buffer / 2) + y;

  state.gpuArray.push(gpu);
}

function scan() {
  if (state.scanCooldown <= 0){
    scanning = true;
    currentScannerScale = 0;
    state.scanCooldown = state.cooldownTime;
    scanner.x = drone.x;
    scanner.y = drone.y;
    stage.addChild(scanner);
    radar.texture = radarEmptyTexture;

    // Show Gpu's in range
    state.gpuArray.forEach(function(gpu) {
      if (distanceBetween(gpu, drone) < (state.scanDiameter / 2)){
        stage.addChild(gpu);
      }
    });
  }
}

function loadOntoDrone(gpu){
  state.gpuOnboard = true;
  stage.removeChild(gpu);
  arrayRemove(state.gpuArray, gpu);
  stage.removeChild(drone);
  stage.addChild(crate);
  stage.addChild(drone);
  stage.addChild(hqHighlight);
}

function offloadFromDrone() {
  stage.removeChild(crate);
  stage.removeChild(hqHighlight);
  updateBalance(state.gpuValue);
  placeGpu();
  state.gpuOnboard = false;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function distanceBetween(a, b) { 
  return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}

function arrayRemove(array, value) { 
  for (var i = 0; i < array.length; i++){
    const index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    }
  }
}

function updateRelativePosition(sprite){
  sprite.x -= droneLeft + droneRight;
  sprite.y -= droneUp + droneDown;
}

function moveTowardCenter(sprite){
  if (drone.x > city.x){
    sprite.x += state.movementSpeed;
  }
  if (drone.x < city.x){
    sprite.x -= state.movementSpeed;
  }
  if (drone.y > city.y){
    sprite.y += state.movementSpeed;
  }
  if (drone.y < city.y){
    sprite.y -= state.movementSpeed;
  }
}

function updateBalance(amount) {
  state.playerBalance += amount;
  balanceText.text = "" + state.playerBalance.toFixed(4);
}
