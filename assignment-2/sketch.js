let particleArray = [];
let xoff = 0.0;

// grain texture
function preload() {
  textureImage = loadImage("./texture.jpg");
}

function setup() {
  // setup canvas
  createCanvas(400, 400);
  background(237, 183, 5);

  // array to store trail "head" information
  for (let i = 0; i < 20; i++) {
    let x = random(width);
    let y = random(height);
    let weight = int(random(1, 5));
    let angle = random(-TWO_PI, TWO_PI);
    let radius = random(1, 10);
    particleArray.push({ x, y, weight, angle, radius });
  }

  // grain setup
  p5grain.setup();
  textureOverlay(textureImage, {
    width: textureImage.width / 2,
    height: textureImage.height / 2,
    animate: true,
  });
}

function draw() {
  // grain
  // applyMonochromaticGrain(3);
  
  // perlin noise
  xoff += 10;

  // for each arc, update next position
  for (let i = 0; i < particleArray.length; i++) {
    // extract coordinate info
    let { x, y, weight, angle, radius } = particleArray[i];
    // add a little Perlin noise to the coordinate
    particleArray[i].x = noise(xoff) + x + radius * cos(angle);
    particleArray[i].y = noise(xoff) + y + radius * sin(angle);
    particleArray[i].angle += 0.02;
    particleArray[i].radius += 0.01;
    stroke(60, 126, 232);
    strokeWeight(weight);
    // draw line between this and prev coordinate
    line(x, y, particleArray[i].x, particleArray[i].y);
  }
  
  // album name
  fill("white");
  noStroke();
  textSize(15);
  textFont("Helvetica");
  text("THE STROKES", 20, 350, 200, 80);
}
