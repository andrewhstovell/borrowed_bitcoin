
// Disable WebGL Aliasing
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

export let textures = {
    drone: [
      PIXI.Texture.from('./assets/drone1.png'), 
      PIXI.Texture.from('./assets/drone2.png'),
      PIXI.Texture.from('./assets/drone3.png'), 
      PIXI.Texture.from('./assets/drone4.png')
    ],
    upgradeButton: PIXI.Texture.from('./assets/button.png'),
    upgradeButton_hover: PIXI.Texture.from('./assets/button_hover.png'),
    upgradeButton_down: PIXI.Texture.from('./assets/button_down.png'),
    warning: PIXI.Texture.from('./assets/warning.png'),
    crate: PIXI.Texture.from('./assets/crate.png'),
    bitcoinLogo: PIXI.Texture.from('./assets/bitcoin_logo.png'),
    gpu: PIXI.Texture.from('./assets/gpu.png'),
    city: PIXI.Texture.from('./assets/map.png'),
    hq_highlighter: PIXI.Texture.from('./assets/hq_highlight.png'),
    scanner: PIXI.Texture.from('./assets/scan.png'),
    tutorial: PIXI.Texture.from('./assets/help.png'),
    radar_empty: PIXI.Texture.from('./assets/radar1.png'),
    radar_ready: PIXI.Texture.from('./assets/radar2.png')
};

export var drone = {
  sprite: new PIXI.Sprite(textures.drone[0]),
  heading: { left: 0, right: 0, up: 0, down: 0 },
  originalWidth: textures.drone[0].width,
  originalHeight: textures.drone[0].height,
  scale: 0,
  movementScalar: 0.85, // For scaling the drones texture while moving
  turningRotation: 0.1 // For rotating the drones texture while moving
}

export let ui = {
  city: new PIXI.Sprite(textures.city),
  tutorial: new PIXI.Sprite(textures.tutorial),
  scanner_state_indicator: new PIXI.Sprite(textures.radar_ready),
  bitcoinLogo: new PIXI.Sprite(textures.bitcoinLogo),
  oob_warning: new PIXI.Sprite(textures.warning),
  crate: new PIXI.Sprite(textures.crate),
  hq_highlighter: new PIXI.Sprite(textures.hq_highlighter),
  scanner: new PIXI.Sprite(textures.scanner),
}

export function initializeView (w, h) {
  drone.sprite.anchor.set(0.5);
  drone.sprite.position.set(w/2, h/2);

  for (const e in ui) {
    ui[e].anchor.set(0.5);
  };

  ui.oob_warning.position.set(w/2, drone.sprite.x - 50);
  ui.city.position.set(w/2, h/2);
  ui.bitcoinLogo.position.set(120, 37);
  ui.hq_highlighter.position.set(ui.city.x, ui.city.y);
  ui.tutorial.anchor.set(0.5, 1);
  ui.tutorial.position.set(w/2, h);
  ui.scanner_state_indicator.position.set(40, h-40);
}

export let fonts = {
  balance: new PIXI.TextStyle({
    fill: "white",
    fontFamily: "Helvetica",
    fontVariant: "small-caps",
    fontSize: 40,
    fontWeight: "bold"
  }),

  button_description: new PIXI.TextStyle({
    fill: "black",
    fontFamily: "Helvetica",
    fontStyle: "italic",
    fontVariant: "small-caps",
    fontSize: 14,
    fontWeight: "bold"
  }),

  button_current_value: new PIXI.TextStyle({
    fill: "#3cc039", // green
    fontFamily: "Helvetica",
    fontSize: 13,
    fontStyle: "italic",
    fontVariant: "small-caps",
    fontWeight: "bold"
  }),

  button_cost: new PIXI.TextStyle({
    fill: "#e6a00a", // orange
    fontFamily: "Helvetica",
    fontSize: 13,
    fontStyle: "italic",
    fontVariant: "small-caps",
    fontWeight: "bold"
  })
};