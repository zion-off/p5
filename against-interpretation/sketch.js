let characters = [];
let fontSize = 12;
let smallFont = 2;
let radius = 150;
let radiusSq = radius * radius;

let textContent;

class Character {
  constructor(char, x, y, width) {
      this.char = char;
      this.x = x;
      this.y = y;
      this.originalX = x;
      this.originalY = y;
      this.width = width;
  }

  display() {
      let dx = mouseX - this.originalX;
      let dy = mouseY - this.originalY;
      let distSq = dx * dx + dy * dy;

      if (distSq < radiusSq) {
          let distance = Math.sqrt(distSq);
          textSize(map(distance, 0, radius, smallFont, fontSize));
          let moveFactor = map(distance, 0, radius, 0.3, 0);
          // let moveFactor = lerp(0, 1 - distance / radius, 0.5);
          dx *= moveFactor;
          dy *= moveFactor;
          text(this.char, this.originalX + dx, this.originalY + dy);
      } else {
          textSize(fontSize);
          text(this.char, this.originalX, this.originalY);
      }
  }
}

function preload() {
  textContent = loadStrings("essay.txt");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(fontSize);

  let x = 10;
  let y = fontSize;

  let flattenedText = textContent.join("\n");

  for (let i = 0; i < flattenedText.length; i++) {
    let char = flattenedText[i];
    if (char === "\n") {
      x = 10;
      y += fontSize;
    } else {
      let charWidth = textWidth(char);
      if (x + charWidth > width) {
        x = 10;
        y += fontSize;
      }
      characters.push(new Character(char, x, y, charWidth));
      x += charWidth;
    }
  }
}

function draw() {
  background(255);
    for (let character of characters) {
        character.display();
    }
}
