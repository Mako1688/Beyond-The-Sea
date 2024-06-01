class Play extends Phaser.Scene {
  constructor() {
    super("playScene");
    this.ANG_VELOCITY = 50; // degrees/second
    this.MAX_VELOCITY = 80; // pixels/second
    this.DRAG = 0.5;
    this.ACCELERATION = 50; // Acceleration when the up arrow is pressed
    this.cumulativeEastWestDistance = 0; // Cumulative distance moved east or west
    this.noiseOpacity = 0; // Initial noise opacity
  }

  preload() {}

  create() {
    const numRows = Math.ceil(h / 16) + 2;
    const numCols = Math.ceil(w / 16) + 2;

    this.waterGroup = this.add.group();

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * 16;
        const y = row * 16;

        if (Math.random() > 0.2) {
          this.waterTile = this.add.sprite(x, y, 'Water Sheet 1');
          this.waterTile.play('shimmer 1');
        } else {
          this.waterTile = this.add.sprite(x, y, 'Water Sheet 2');
          this.waterTile.play('shimmer 2');
        }

        const randomFrame = Phaser.Math.Between(0, 3);
        this.waterTile.anims.setCurrentFrame(this.waterTile.anims.currentAnim.frames[randomFrame]);

        const flipX = Phaser.Math.Between(0, 1) === 1;
        const flipY = Phaser.Math.Between(0, 1) === 1;
        this.waterTile.setFlip(flipX, flipY);

        this.waterGroup.add(this.waterTile);

        this.waterTile.initialX = x;
        this.waterTile.initialY = y;
      }
    }

    this.waterGroup.setDepth(-1);

    this.boat = this.physics.add.sprite(w / 2, h / 2, 'Boat Sheet', 0);
    this.boat.angle = 180;
    this.boat.setMaxVelocity(this.MAX_VELOCITY);
    this.boat.setDamping(true);
    this.boat.setDrag(this.DRAG);
    this.boat.body.collideWorldBounds = false; // Disable world bounds collision
    this.boat.play('Boat_Idle');
    this.boat.setOrigin(0.5, 0.5);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.startFollow(this.boat);

    const noiseResolution = 64; // number of cells per row/column
    this.noiseGrid = [];
    this.createNoiseGrid(noiseResolution);
  }

  createNoiseGrid(resolution) {
    const cellWidth = w / resolution;
    const cellHeight = h / resolution;

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const rect = this.add.rectangle(x * cellWidth, y * cellHeight, cellWidth, cellHeight, 0x000000).setOrigin(0);
        rect.alpha = this.noiseOpacity; // Initial alpha set to 0
        rect.setDepth(1); // Ensure noise grid is above water tiles
        this.noiseGrid.push(rect);
      }
    }
  }

  update() {
    if (this.cursors.left.isDown) {
      this.boat.setAngularVelocity(-this.ANG_VELOCITY);
    } else if (this.cursors.right.isDown) {
      this.boat.setAngularVelocity(this.ANG_VELOCITY);
    } else {
      this.boat.setAngularVelocity(0);
    }

    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(this.boat.rotation - Math.PI / 2 * 3, this.ACCELERATION, this.boat.body.acceleration);
    } else {
      this.boat.setAcceleration(0);
    }

    this.physics.velocityFromRotation(this.boat.rotation - Math.PI / 2 * 3, this.boat.body.speed, this.boat.body.velocity);

    const boatVelocity = this.boat.body.velocity;

    this.waterGroup.children.iterate((waterTile) => {
      waterTile.x -= boatVelocity.x * this.game.loop.delta / 1000;
      waterTile.y -= boatVelocity.y * this.game.loop.delta / 1000;

      if (waterTile.x < this.cameras.main.scrollX - 16) {
        waterTile.x += w + 32;
      } else if (waterTile.x > this.cameras.main.scrollX + w + 16) {
        waterTile.x -= w + 32;
      }
      if (waterTile.y < this.cameras.main.scrollY - 16) {
        waterTile.y += h + 32;
      } else if (waterTile.y > this.cameras.main.scrollY + h + 16) {
        waterTile.y -= h + 32;
      }
    });

    if (this.boat.x < this.cameras.main.scrollX) {
      this.boat.x = this.cameras.main.scrollX + w;
    } else if (this.boat.x > this.cameras.main.scrollX + w) {
      this.boat.x = this.cameras.main.scrollX;
    }
    if (this.boat.y < this.cameras.main.scrollY) {
      this.boat.y = this.cameras.main.scrollY + h;
    } else if (this.boat.y > this.cameras.main.scrollY + h) {
      this.boat.y = this.cameras.main.scrollY;
    }

    if (this.boat.body.velocity.y < 0) {
      console.log('moving North');
    }

    if (this.boat.body.velocity.y > 0) {
      console.log('moving South');
    }

    if (this.boat.body.velocity.x > 0) {
      console.log('moving East');
    }

    if (this.boat.body.velocity.x < 0) {
      console.log('moving West');
    }

    const delta = this.game.loop.delta / 1000; // Time delta in seconds
    if (boatVelocity.x < 0) {
      this.cumulativeEastWestDistance += Math.abs(boatVelocity.x) * delta;
    } else if (boatVelocity.x > 0) {
      this.cumulativeEastWestDistance -= Math.abs(boatVelocity.x) * delta;
    }

    this.adjustNoiseOpacity();
    this.adjustNoiseGridPosition();
    this.updateNoiseGridColors(); // Update noise grid colors
  }

  adjustNoiseGridPosition() {
    const cameraX = this.cameras.main.scrollX;
    const cameraY = this.cameras.main.scrollY;
    const resolution = Math.sqrt(this.noiseGrid.length); // Assuming it's a square grid
    const cellWidth = w / resolution;
    const cellHeight = h / resolution;

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const rect = this.noiseGrid[y * resolution + x];
        rect.x = cameraX + x * cellWidth;
        rect.y = cameraY + y * cellHeight;
      }
    }
  }

  adjustNoiseOpacity() {
    const maxOpacity = 1;
    const minOpacity = 0;
    const opacityRange = maxOpacity - minOpacity;
    const maxDistance = 1000; // Max cumulative distance for full opacity

    this.noiseOpacity = Phaser.Math.Clamp(this.cumulativeEastWestDistance / maxDistance, minOpacity, maxOpacity);

    console.log("Changing opacity to " + this.noiseOpacity);

    this.noiseGrid.forEach(rect => {
      rect.alpha = this.noiseOpacity; // Correctly set the alpha
    });
  }

  updateNoiseGridColors() {
    this.noiseGrid.forEach(rect => {
      const colorValue = Phaser.Math.Between(0, 255);
      rect.setFillStyle(Phaser.Display.Color.GetColor(colorValue, colorValue, colorValue), this.noiseOpacity);
    });
  }
}
