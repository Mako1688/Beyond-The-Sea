class Title extends Phaser.Scene {
  constructor() {
    super("titleScene");
  }

  init() {}

  preload() {}

  create() {
    const { width, height } = this.cameras.main;

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

    // Add title text
    const titleText = this.add.text(width / 2, height / 4, 'Beyond The Sea', {
      fontFamily: 'Georgia, serif',
      fontSize: '64px',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);

    // Add subtitle text
    const subtitleText = this.add.text(width / 2, height / 4 + 60, 'By Marco Ogaz-Vega', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#ffffff'
    });
    subtitleText.setOrigin(0.5);

    // Add instructions text
    const instructions = 'Explore in any direction\nMove with the arrow keys\nPress R to restart\nPress SPACE to begin';
    const instructionsText = this.add.text(width / 2, height / 2 + 10, instructions, {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    });
    instructionsText.setOrigin(0.5);

    // Listen for key inputs
    this.input.keyboard.on('keydown-SPACE', () => {
      this.scene.start('playScene');
    });

    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    });
  }

  update() {}
}
