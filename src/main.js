// Game: Beyond The Sea
// Name: Marco Ogaz-Vega
// Date: 5/8/24
/*
Approx hours: 
*/

/*TO DO LIST:
    
*/
"use strict";

let config = {
  type: Phaser.WEBGL,
  width: 640,
  height: 640,
  pixelArt: true,
  mode: Phaser.Scale.FIT,
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  frameRate: 60,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: {
        x: 0,
        y: 0,
      },
    },
  },
  scene: [Load, Title, Play],
};

let game = new Phaser.Game(config);

let { width, height } = game.config;

// some globals
const centerX = game.config.width / 2;
const centerY = game.config.height / 2;
const w = game.config.width;
const h = game.config.height;
//create border padding constant
const borderPadding = 20;
