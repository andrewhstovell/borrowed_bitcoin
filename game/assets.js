
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