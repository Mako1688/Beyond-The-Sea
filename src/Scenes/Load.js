class Load extends Phaser.Scene {
  constructor() {
    super("loadScene");
  }

  init() {}

  preload() {
    //load sounds
    // this.load.audio('ocean sounds', './assets/Sounds/Ocean Sounds.mp3')

    this.load.spritesheet("Water Sheet 1", "./assets/SpriteSheets/Water_Spritesheet.png", {
      frameWidth: 16,
      frameHeight: 16,
      startFrame: 0,
      endFrame: 3,
    });

    this.load.spritesheet("Water Sheet 2", "./assets/SpriteSheets/Water_Sheet 2.png", {
      frameWidth: 16,
      frameHeight: 16,
      startFrame: 0,
      endFrame: 3,
    });

    this.load.spritesheet('Boat Sheet', './assets/SpriteSheets/Boat_Sheet.png', {
      frameWidth: 64,
      frameHeight: 64,
      startFrame: 0,
      endFrame: 12
    })

    //load shaders
     // Load shaders
    //  this.load.glsl('pixelSortingShader', './assets/Shaders/pixel_sorting.glsl');
    //  this.load.glsl('datamoshingShader', './assets/Shaders/datamoshing.glsl');
    //  this.load.glsl('pixelatePalletizeShader', './assets/Shaders/pixelate_palletize.glsl');
    //  this.load.glsl('glitchShader', './assets/Shaders/glitch.glsl');
  }

  create() {
    //create animations
    this.anims.create({
      key: "shimmer 1",
      frames: this.anims.generateFrameNumbers("Water Sheet 1", {
        start: 0,
        end: 3,
        first: 0,
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "shimmer 2",
      frames: this.anims.generateFrameNumbers("Water Sheet 2", {
        start: 0,
        end: 3,
        first: 0,
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "Boat_Idle",
      frames: this.anims.generateFrameNumbers("Boat Sheet", {
        start: 0,
        end: 5,
        first: 0,
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "Boat_Move",
      frames: this.anims.generateFrameNumbers("Boat Sheet", {
        start: 6,
        end: 12,
        first: 6,
      }),
      frameRate: 5,
      repeat: -1
    });
  }

  update() {
    this.scene.start("titleScene")
  }
}
