class Play extends Phaser.Scene {
  constructor() {
    super("playScene");
    // Define variables
    this.ANG_VELOCITY = 50; // degrees/second
    this.MAX_VELOCITY = 80; // pixels/second
    this.DRAG = 0.5;
    this.ACCELERATION = 50; // Acceleration when the up arrow is pressed
  }

  preload() {}

  create() {
    // Calculate the number of rows and columns based on canvas size and tile size
    const numRows = Math.ceil(h / 16) + 2;
    const numCols = Math.ceil(w / 16) + 2;

    // Create a group to hold all water tiles
    this.waterGroup = this.add.group();

    // Loop through each row and column to create water tiles
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        // Calculate the position of the tile
        const x = col * 16;
        const y = row * 16;

        if(Math.random() > 0.2) {
          // Create a water tile sprite at this position
          this.waterTile = this.add.sprite(x, y, 'Water Sheet 1');

          // Add the shimmer animation to the water tile
          this.waterTile.play('shimmer 1');
        } else {
          // Create a water tile sprite at this position
          this.waterTile = this.add.sprite(x, y, 'Water Sheet 2');

          // Add the shimmer animation to the water tile
          this.waterTile.play('shimmer 2');
        }
        
        // Set the current frame of the animation randomly to create the effect of different starting frames
        const randomFrame = Phaser.Math.Between(0, 3); // Assuming there are 4 frames (0 to 3)
        this.waterTile.anims.setCurrentFrame(this.waterTile.anims.currentAnim.frames[randomFrame]);

        // Randomly flip the water tile
        const flipX = Phaser.Math.Between(0, 1) === 1;
        const flipY = Phaser.Math.Between(0, 1) === 1;
        this.waterTile.setFlip(flipX, flipY);

        // Add the water tile to the group
        this.waterGroup.add(this.waterTile);

        // Store initial position
        this.waterTile.initialX = x;
        this.waterTile.initialY = y;
      }
    }

    // Set the depth of the water group to be behind other game elements
    this.waterGroup.setDepth(-1);

    // Create the boat sprite and set its initial position and animation
    this.boat = this.physics.add.sprite(w / 2, h / 2, 'Boat Sheet', 0);
    // Set the initial direction of the boat sprite to face right
    this.boat.angle = 180;
    this.boat.setMaxVelocity(this.MAX_VELOCITY);
    this.boat.setDamping(true);
    this.boat.setDrag(this.DRAG);
    this.boat.body.collideWorldBounds = false; // Disable world bounds collision
    this.boat.play('Boat_Idle');

    // Set the origin of the boat sprite to its center
    this.boat.setOrigin(0.5, 0.5);

    // Enable keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Make the camera follow the boat
    this.cameras.main.startFollow(this.boat);

    // // Store a reference to the main camera
    // this.mainCamera = this.cameras.main;

    // // Create a render texture to hold the sorted image
    // this.sortTexture = this.textures.createCanvas('sortTexture', this.mainCamera.width, this.mainCamera.height);

    // // Create a RenderTexture to render the scene
    // this.renderedTexture = this.add.renderTexture(0, 0, this.mainCamera.width, this.mainCamera.height);
  }


  update() {
    // Handle boat rotation based on user input
    if (this.cursors.left.isDown) {
      this.boat.setAngularVelocity(-this.ANG_VELOCITY);
    } else if (this.cursors.right.isDown) {
      this.boat.setAngularVelocity(this.ANG_VELOCITY);
    } else {
      this.boat.setAngularVelocity(0);
    }

    // Adjust acceleration based on user input
    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(this.boat.rotation - Math.PI / 2 * 3, this.ACCELERATION, this.boat.body.acceleration);
    } else {
      this.boat.setAcceleration(0);
    }

    // Adjust velocity based on the direction the boat is facing
    this.physics.velocityFromRotation(this.boat.rotation - Math.PI / 2 * 3, this.boat.body.speed, this.boat.body.velocity);

    // Move water tiles in the opposite direction of the boat
    const boatVelocity = this.boat.body.velocity;

    this.waterGroup.children.iterate((waterTile) => {
      waterTile.x -= boatVelocity.x * this.game.loop.delta / 1000;
      waterTile.y -= boatVelocity.y * this.game.loop.delta / 1000;

      // Wrap water tiles around the screen
      if (waterTile.x < this.cameras.main.scrollX - 16) {
        waterTile.x += w + 32;
      } else if (waterTile.x > this.cameras.main.scrollX + w + 16) {
        waterTile.x -= w + 32;
      }
      if (waterTile.y < this.cameras.main.scrollY - 16) {
        waterTile.y += h + 32;
      } else if (waterTile.y > this.cameras.main.scrollY + w + 16) {
        waterTile.y -= h + 32;
      }
    });

    // Wrap the boat around the edges of the screen
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

    // Check if the boat is moving north (up)
    if (this.boat.body.velocity.y < 0) {
      console.log('moving North')
      // // Render the scene to the RenderTexture
      // this.renderedTexture.clear();
      // this.renderedTexture.draw(this.mainCamera);

      // // Get the pixel data from the rendered texture
      // const pixels = this.sortTexture.context.getImageData(0, 0, this.sortTexture.width, this.sortTexture.height).data;

      // // Sort the pixels based on brightness
      // pixels.sort((a, b) => {
      //     const brightnessA = (a[0] + a[1] + a[2]) / 3;
      //     const brightnessB = (b[0] + b[1] + b[2]) / 3;
      //     return brightnessA - brightnessB;
      // });

      // // Put the sorted pixels back into the texture
      // this.sortTexture.context.putImageData(new ImageData(pixels, this.sortTexture.width, this.sortTexture.height), 0, 0);

      // // Render the sorted texture back onto the screen
      // this.add.image(0, 0, 'sortTexture').setOrigin(0);
    }

    if(this.boat.body.velocity.y > 0) {
      console.log('moving South')
    }

    if(this.boat.body.velocity.x > 0) {
      console.log('moving East')
    }

    if(this.boat.body.velocity.x < 0) {
      console.log('moving West')
    }
  }

  sortTexture() {
    // Get the pixel data from the sort texture
    const imageData = this.sortTexture.context.getImageData(0, 0, this.sortTexture.width, this.sortTexture.height);
    const pixels = imageData.data;

    // Sort the pixels based on brightness
    pixels.sort((a, b) => {
        const brightnessA = (a[0] + a[1] + a[2]) / 3;
        const brightnessB = (b[0] + b[1] + b[2]) / 3;
        return brightnessA - brightnessB;
    });

    // Put the sorted pixels back into the texture
    this.sortTexture.context.putImageData(new ImageData(pixels, this.sortTexture.width, this.sortTexture.height), 0, 0);

    // Render the sorted texture back onto the screen
    this.add.image(0, 0, 'sortTexture').setOrigin(0);
  }


}
