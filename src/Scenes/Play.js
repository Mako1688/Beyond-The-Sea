class Play extends Phaser.Scene {
  constructor() {
    super("playScene");
    this.ANG_VELOCITY = 50; // degrees/second
    this.MAX_VELOCITY = 80; // pixels/second
    this.DRAG = 0.5;
    this.ACCELERATION = 50; // Acceleration when the up arrow is pressed
    this.cumulativeEastWestDistance = 0; // Cumulative distance moved east or west
    this.noiseOpacity = 0; // Initial noise opacity
    this.cumulativeNorthSouthDistance = 0; // Cumulative distance moved north or south
    this.pixelateEffect = null; // Pixelation effect reference
    this.barrelEffect = null; // Barrel distortion effect reference
    this.blurEffect = null; // Blur effect reference
    this.staticVolumeRatio = 0; // Initial static sound volume ratio
    this.buzzSoundRatio = 0; // Initial buzz sound volume ratio
  }

  preload() {}

  create() {
    // Add ocean sounds and play them on loop
    this.oceanSounds = this.sound.add('oceanSounds', { loop: true });
    this.oceanSounds.play();

    this.staticSounds = this.sound.add('Static', {loop: true});
    this.staticSounds.play();

    this.buzzSounds = this.sound.add('Buzz', {loop: true});
    this.buzzSounds.play();

    const numRows = Math.ceil(h / 16) + 2;
    const numCols = Math.ceil(w / 16) + 2;

    this.waterGroup = this.add.group();

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * 16;
        const y = row * 16;

        const waterTile = this.add.sprite(x, y, Math.random() > 0.2 ? 'Water Sheet 1' : 'Water Sheet 2');
        waterTile.play(Math.random() > 0.2 ? 'shimmer 1' : 'shimmer 2');
        
        const randomFrame = Phaser.Math.Between(0, 3);
        waterTile.anims.setCurrentFrame(waterTile.anims.currentAnim.frames[randomFrame]);

        const flipX = Phaser.Math.Between(0, 1) === 1;
        const flipY = Phaser.Math.Between(0, 1) === 1;
        waterTile.setFlip(flipX, flipY);

        this.waterGroup.add(waterTile);

        waterTile.initialX = x;
        waterTile.initialY = y;
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

    // Make the camera follow the boat
    this.cameras.main.startFollow(this.boat);

    const noiseResolution = 64; // number of cells per row/column
    this.noiseGrid = [];
    this.createNoiseGrid(noiseResolution);

    // Create a container for the compass and pointer
    this.compassContainer = this.add.container();

    // Create compass graphics
    this.createCompassGraphics();

    // Add the compass container to the scene
    this.add.existing(this.compassContainer);

    // Add reset functionality on 'R' key press
    this.input.keyboard.on('keydown-R', () => {
      this.resetGame();
    });

    // Add reset text
    this.resetText = this.add.text(w / 2, h - 60, 'Press R to reset', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }

  resetGame() {
    // Resetting variables
    this.cumulativeEastWestDistance = 0;
    this.noiseOpacity = 0;
    this.cumulativeNorthSouthDistance = 0;
    this.pixelateEffect = null;
    this.barrelEffect = null;
    this.blurEffect = null;
    this.staticVolumeRatio = 0;
    this.buzzSoundRatio = 0;

    // Resetting boat position and state
    this.boat.setPosition(w / 2, h / 2);
    this.boat.setVelocity(0, 0);
    this.boat.setAcceleration(0);
    this.boat.angle = 180;

    // Resetting water tiles position
    this.waterGroup.children.iterate((waterTile) => {
      waterTile.x = waterTile.initialX;
      waterTile.y = waterTile.initialY;
    });

    // Resetting noise grid
    this.noiseGrid.forEach(rect => {
      rect.alpha = this.noiseOpacity;
    });

    // Resetting camera effects
    this.cameras.main.postFX.clear();
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

  createCompassGraphics() {
    // Add compass directions (N, S, E, W) text
    const directions = ['N', 'E', 'S', 'W'];
    const textStyles = ['#ffffff', '#ffffff', '#ffffff', '#ffffff']; // Initial colors for each direction

    directions.forEach((direction, index) => {
      const textConfig = {
        x: 50,
        y: 50 + index * 20, // Adjust Y position for each direction
        text: direction,
        style: {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: textStyles[index],
          align: 'center'
        }
      };
      const compassText = this.make.text(textConfig);
      compassText.setOrigin(0.5);
      this.compassContainer.add(compassText);
    });
  }

  update(time, delta) {
    // Adjust audio based on westward movement
    // Calculate the ratio of static sound volume to max volume based on noise opacity
    if (this.noiseOpacity != 1) {
      this.staticVolumeRatio = this.noiseOpacity * 0.5;
    } else {
      this.staticVolumeRatio = .5;
    }

    // Set the volume of static sound to be proportional to the noise opacity
    this.staticSounds.setVolume(this.staticVolumeRatio);

    this.oceanSounds.setVolume(2 - (this.staticVolumeRatio * 0.5));

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

    if (boatVelocity.y > 0) {
      this.oceanSounds.setDetune(-this.cumulativeNorthSouthDistance);
    } else if (boatVelocity.y < 0) {
      this.oceanSounds.setDetune(-this.cumulativeNorthSouthDistance);
    }

    // Update the position of the reset text to follow the camera
    this.resetText.x = this.cameras.main.scrollX + w / 2;
    this.resetText.y = this.cameras.main.scrollY + h - 60;

    this.waterGroup.children.iterate((waterTile) => {
      waterTile.x -= boatVelocity.x * delta / 1000;
      waterTile.y -= boatVelocity.y * delta / 1000;

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

    // Adjust pixelation based on north-south movement
    const maxPixelation = 3; // Reduced for more subtle effect
    const maxDistance = 2000; // Increased for slower change

    // Increase pixelation only when moving north
    if (boatVelocity.y < 0) {
      this.cumulativeNorthSouthDistance += Math.abs(boatVelocity.y) * delta / 1000;
    } else if (boatVelocity.y > 0) { // Decrease pixelation when moving south
      this.cumulativeNorthSouthDistance -= Math.abs(boatVelocity.y) * delta / 1000;
    }

    const pixelationAmount = Phaser.Math.Clamp(this.cumulativeNorthSouthDistance / maxDistance * maxPixelation, 0, maxPixelation);
    if (pixelationAmount > 0) {
      if (!this.pixelateEffect) {
        this.pixelateEffect = this.cameras.main.postFX.addPixelate(pixelationAmount);
      } else {
        this.pixelateEffect.amount = pixelationAmount;
      }
    } else if (this.pixelateEffect) {
      this.cameras.main.postFX.remove(this.pixelateEffect);
      this.pixelateEffect = null;
    }

    const pixelationPercentage = (pixelationAmount / maxPixelation) * 100;
    console.log(`Pixelation: ${pixelationPercentage.toFixed(2)}%`);

    // Adjust barrel distortion based on north-south movement
    const maxBarrelAmount = 3; // Maximum barrel distortion amount
    const maxBarrelDistance = -1500; // Maximum cumulative distance for full distortion

    const barrelAmount = Phaser.Math.Clamp(this.cumulativeNorthSouthDistance / maxBarrelDistance * maxBarrelAmount, 1, maxBarrelAmount);

    if (barrelAmount > 0) {
      if (!this.barrelEffect) {
        this.barrelEffect = this.cameras.main.postFX.addBarrel(barrelAmount);
      } else {
        this.barrelEffect.amount = barrelAmount;
      }
    } else if (this.barrelEffect) {
      this.cameras.main.postFX.remove(this.barrelEffect);
      this.barrelEffect = null;
    }

    const barrelPercentage = (barrelAmount / maxBarrelAmount) * 100;
    console.log(`Barrel Distortion: ${barrelPercentage.toFixed(2)}%`);

    // Adjust blur effect based on east-west movement
    const maxBlurStrength = 3; // Maximum blur strength
    const maxBlurDistance = -1500; // Maximum cumulative distance for full blur

    // Increase blur when moving west
    if (boatVelocity.x < 0) {
      this.cumulativeEastWestDistance += Math.abs(boatVelocity.x) * delta / 1000;
    } else if (boatVelocity.x > 0) { // Decrease blur when moving east
      this.cumulativeEastWestDistance -= Math.abs(boatVelocity.x) * delta / 1000;
    }

    const blurStrength = Phaser.Math.Clamp(this.cumulativeEastWestDistance / maxBlurDistance * maxBlurStrength, 0, maxBlurStrength);

    if (blurStrength > 0) {
      if (!this.blurEffect) {
        this.blurEffect = this.cameras.main.postFX.addBlur(3, 2, 0, blurStrength, 0xffffff, 10); // Medium quality blur
      } else {
        this.blurEffect.strength = blurStrength;
      }
    } else if (this.blurEffect) {
      this.cameras.main.postFX.remove(this.blurEffect);
      this.blurEffect = null;
    }

    const blurPercentage = (blurStrength / maxBlurStrength) * 100;
    console.log(`Blur Strength: ${blurPercentage.toFixed(2)}%`);

    // Calculate the ratio of static sound volume to max volume based on noise opacity
    if (blurPercentage > 1) {
      this.buzzSoundRatio = blurPercentage / 100;
      this.oceanSounds.setVolume(2 - (this.buzzSoundRatio * 2));
      this.buzzSounds.setVolume(this.buzzSoundRatio);
    }

    this.adjustNoiseOpacity();
    this.adjustNoiseGridPosition();
    this.updateNoiseGridColors(); // Update noise grid colors

    // Update compass position based on the boat's position
    this.updateCompassPosition();

    // Update pointer direction
    this.updatePointerDirection();
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
    const maxDistance = 2000; // Max cumulative distance for full opacity

    this.noiseOpacity = Phaser.Math.Clamp(this.cumulativeEastWestDistance / maxDistance, minOpacity, maxOpacity);

    console.log("Noise Strength: " + this.noiseOpacity);

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

  updateCompassPosition() {
    const compassX = 50;
    const compassY = 50;
  
    // Set compass position in world coordinates
    this.compassContainer.x = this.cameras.main.scrollX + compassX;
    this.compassContainer.y = this.cameras.main.scrollY + compassY;
  }
  
  updatePointerDirection() {
    const boatDirection = Phaser.Math.Angle.Wrap(this.boat.rotation); // Wrap angle to ensure it stays within [-π, π]

    // Determine the cardinal direction based on boat's rotation
    let cardinalDirection = '';
    if (Math.abs(boatDirection) < Math.PI / 4) {
      cardinalDirection = 'S'; // South
    } else if (Math.abs(boatDirection) > 3 * Math.PI / 4) {
      cardinalDirection = 'N'; // North
    } else if (boatDirection > 0) {
      cardinalDirection = 'W'; // West
    } else {
      cardinalDirection = 'E'; // East
    }

    // Set text style color based on cardinal direction
    this.compassContainer.iterate((text) => {
      if (text.text === cardinalDirection) {
        text.setFill('#ff0000'); // Red color for cardinal direction
      } else {
        text.setFill('#ffffff'); // White color for other directions
      }
    });
  }
}
