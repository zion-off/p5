let characters = [];
let rows = [];
let fontSize = 12;
let smallFont = 2;
let radius = 150;
let radiusSq = radius * radius;

// Springs: moving the mouse pushes nearby letters, which wobble back home.
let pushRadius = 150;
let pushStrength = 0.12;
let maxPushSpeed = 60;
let stiffness = 0.08;
let damping = 0.86;
let maxOffset = 60;
let restThreshold = 0.05;
let activeSprings = new Set();

// Letters are drawn with WebGL: every glyph is rasterized once into an atlas
// texture by the browser's own text renderer, then all letters are drawn
// each frame as textured quads in a single instanced draw call.
// Resting glyphs are snapped to device pixels using one of several
// pre-rendered horizontal subpixel offsets, so they stay as crisp as native
// canvas text.
let subpixelSteps = 16;
let atlasPadding = 8;
let gl;
let glyphRenderer;
let instances = [];
let instanceData;
let prevMoving = [];

let textContent;
let frameId = 0;
let lastMouseX = null;
let lastMouseY = null;

class Character {
  constructor(char, x, y, width) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.width = width;
    // spring offset and velocity
    this.ox = 0;
    this.oy = 0;
    this.vx = 0;
    this.vy = 0;
    // where and how big it is drawn this frame
    this.drawX = x;
    this.drawY = y;
    this.size = fontSize;
    this.movingFrame = -1;
    // atlas glyph and instance slot; letters that are never drawn have none
    this.glyph = null;
    this.index = -1;
  }
}

function preload() {
  textContent = loadStrings("essay.txt");
}

function setup() {
  // The canvas is only drawn to with raw WebGL; p5's depth, stencil and
  // multisampling would be wasted work.
  setAttributes({ antialias: false, depth: false, stencil: false });
  createCanvas(windowWidth, windowHeight, WEBGL);
  gl = drawingContext;
  if (!(gl instanceof WebGL2RenderingContext)) {
    throw new Error("This sketch needs WebGL 2.");
  }

  let measure = document.createElement("canvas").getContext("2d");
  measure.font = `normal ${fontSize}px sans-serif`;

  let x = 10;
  let y = fontSize;
  let row = [];
  rows.push(row);

  let flattenedText = textContent.join("\n");

  for (let i = 0; i < flattenedText.length; i++) {
    let char = flattenedText[i];
    if (char === "\n") {
      x = 10;
      y += fontSize;
      row = [];
      rows.push(row);
    } else {
      let charWidth = measure.measureText(char).width;
      if (x + charWidth > width) {
        x = 10;
        y += fontSize;
        row = [];
        rows.push(row);
      }
      let character = new Character(char, x, y, charWidth);
      characters.push(character);
      row.push(character);
      x += charWidth;
    }
  }

  // Letters far below the window can never be pulled into view.
  let drawable = characters.filter(
    (c) => c.char.trim() !== "" && c.y <= height + radius + maxOffset
  );
  let glyphs = buildGlyphAtlas([...new Set(drawable.map((c) => c.char))]);
  for (let c of drawable) {
    c.glyph = glyphs.get(c.char);
    if (!c.glyph) continue;
    c.index = instances.length;
    instances.push(c);
  }
  glyphRenderer = createGlyphRenderer(glyphs.atlas);
  instanceData = new Float32Array(instances.length * 4);
  for (let c of instances) writeRestingInstance(c);
  glyphRenderer.setCells(instances);
}

function draw() {
  let mouseMoved = mouseX !== lastMouseX || mouseY !== lastMouseY;
  if (!mouseMoved && activeSprings.size === 0) return;
  frameId++;

  if (mouseMoved && lastMouseX !== null) {
    pushLetters(mouseX - lastMouseX, mouseY - lastMouseY);
  }
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  stepSprings();
  updateInstances();
  glyphRenderer.draw(instanceData, instances.length);
}

function pushLetters(mvx, mvy) {
  let speed = Math.hypot(mvx, mvy);
  if (speed > maxPushSpeed) {
    mvx *= maxPushSpeed / speed;
    mvy *= maxPushSpeed / speed;
    speed = maxPushSpeed;
  }
  forEachCharNear(mouseX, mouseY, pushRadius, (c, dx, dy, distSq) => {
    let d = Math.sqrt(distSq) || 1;
    let falloff = 1 - d / pushRadius;
    let k = pushStrength * falloff * falloff;
    // away from the cursor, plus a nudge in the direction it is travelling
    c.vx += (-dx / d * speed + mvx) * k;
    c.vy += (-dy / d * speed + mvy) * k;
    activeSprings.add(c);
  });
}

function stepSprings() {
  for (let c of activeSprings) {
    c.vx = (c.vx - c.ox * stiffness) * damping;
    c.vy = (c.vy - c.oy * stiffness) * damping;
    c.ox += c.vx;
    c.oy += c.vy;
    let offset = Math.hypot(c.ox, c.oy);
    if (offset > maxOffset) {
      c.ox *= maxOffset / offset;
      c.oy *= maxOffset / offset;
    }
    if (
      Math.abs(c.ox) < restThreshold && Math.abs(c.oy) < restThreshold &&
      Math.abs(c.vx) < restThreshold && Math.abs(c.vy) < restThreshold
    ) {
      c.ox = c.oy = c.vx = c.vy = 0;
      activeSprings.delete(c);
    }
  }
}

function updateInstances() {
  let moving = [];
  let markMoving = (c) => {
    if (c.movingFrame === frameId) return;
    c.movingFrame = frameId;
    c.drawX = c.x + c.ox;
    c.drawY = c.y + c.oy;
    c.size = fontSize;
    moving.push(c);
  };

  forEachCharNear(mouseX, mouseY, radius, (c, dx, dy, distSq) => {
    markMoving(c);
    let falloff = lensFalloff(distSq);
    c.size = lerp(fontSize, smallFont, falloff);
    let moveFactor = 0.3 * falloff;
    c.drawX += dx * moveFactor;
    c.drawY += dy * moveFactor;
  });
  for (let c of activeSprings) markMoving(c);

  for (let c of prevMoving) {
    if (c.movingFrame !== frameId) writeRestingInstance(c);
  }
  for (let c of moving) writeMovingInstance(c);
  prevMoving = moving;
}

// Instance layout: quad left/top in device pixels, scale, subpixel variant.
function writeRestingInstance(c) {
  let d = pixelDensity();
  let gx = c.x * d;
  let px = Math.floor(gx);
  let variant = Math.floor((gx - px) * subpixelSteps);
  let i = c.index * 4;
  instanceData[i] = px - c.glyph.originX;
  instanceData[i + 1] = Math.round(c.y * d) - c.glyph.originY;
  instanceData[i + 2] = 1;
  instanceData[i + 3] = variant;
}

function writeMovingInstance(c) {
  let d = pixelDensity();
  let scale = c.size / fontSize;
  let i = c.index * 4;
  instanceData[i] = c.drawX * d - (c.glyph.originX + variantShift(0)) * scale;
  instanceData[i + 1] = c.drawY * d - c.glyph.originY * scale;
  instanceData[i + 2] = scale;
  instanceData[i + 3] = 0;
}

// 1 at the cursor, easing to 0 at the lens edge with zero slope at both ends,
// so the lens blends into the surrounding text instead of ending in a ring.
function lensFalloff(distSq) {
  let t = 1 - distSq / radiusSq;
  return t * t;
}

// Calls fn(c, dx, dy, distSq) for each drawn letter whose home is within r of
// (x, y), where (dx, dy) points from the letter to (x, y).
function forEachCharNear(x, y, r, fn) {
  let rSq = r * r;
  // Row i has its baseline at fontSize * (i + 1).
  let firstRow = max(0, floor((y - r) / fontSize) - 1);
  let lastRow = min(rows.length - 1, ceil((y + r) / fontSize));
  for (let i = firstRow; i <= lastRow; i++) {
    for (let c of rows[i]) {
      if (c.index < 0) continue;
      let dx = x - c.x;
      let dy = y - c.y;
      let distSq = dx * dx + dy * dy;
      if (distSq < rSq) fn(c, dx, dy, distSq);
    }
  }
}

// Variant k covers horizontal subpixel offsets [k, k + 1) / subpixelSteps
// and is rendered at the middle of that range. Browsers that snap glyphs to
// a coarser subpixel grid (Chrome uses quarter pixels) then snap it exactly
// as they would the native text, while browsers with finer positioning
// (Safari) are off by at most half a step.
function variantShift(k) {
  return (k + 0.5) / subpixelSteps;
}

// Rasterizes each glyph at device resolution, black on white exactly like
// the canvas text it replaces, and stores 255 - red as coverage. The atlas
// holds subpixelSteps vertically stacked copies, each shifted right by a
// further 1/subpixelSteps of a pixel.
function buildGlyphAtlas(chars) {
  let d = pixelDensity();
  let ctx = document.createElement("canvas").getContext("2d");
  let font = `normal ${fontSize * d}px sans-serif`;
  ctx.font = font;

  let pad = atlasPadding;
  let ascent = 0;
  let descent = 0;
  let metrics = chars.map((ch) => {
    let m = ctx.measureText(ch);
    ascent = Math.max(ascent, m.actualBoundingBoxAscent);
    descent = Math.max(descent, m.actualBoundingBoxDescent);
    return m;
  });
  let cellH = Math.ceil(ascent + descent) + pad * 2;
  let originY = pad + Math.ceil(ascent);

  let atlasW = 1024;
  let x = 0;
  let y = 0;
  let glyphs = new Map();
  chars.forEach((ch, n) => {
    let m = metrics[n];
    let left = Math.max(0, Math.ceil(m.actualBoundingBoxLeft));
    // +1 leaves room for the largest subpixel shift
    let right = Math.max(0, Math.ceil(m.actualBoundingBoxRight)) + 1;
    let w = left + right + pad * 2;
    if (x + w > atlasW) {
      x = 0;
      y += cellH;
    }
    glyphs.set(ch, { u: x, v: y, w, h: cellH, originX: pad + left, originY });
    x += w;
  });
  let blockH = y + cellH;
  let atlasH = blockH * subpixelSteps;

  ctx.canvas.width = atlasW;
  ctx.canvas.height = atlasH;
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, atlasW, atlasH);
  ctx.fillStyle = "#000";
  for (let k = 0; k < subpixelSteps; k++) {
    for (let [ch, g] of glyphs) {
      ctx.fillText(ch, g.u + g.originX + variantShift(k), k * blockH + g.v + g.originY);
    }
  }
  let rgba = ctx.getImageData(0, 0, atlasW, atlasH).data;
  let coverage = new Uint8Array(atlasW * atlasH);
  for (let i = 0; i < coverage.length; i++) coverage[i] = 255 - rgba[i * 4];

  glyphs.atlas = { width: atlasW, height: atlasH, blockH, coverage };
  return glyphs;
}

function createGlyphRenderer(atlas) {
  let vs = `#version 300 es
    layout(location = 0) in vec2 corner;
    layout(location = 1) in vec4 cell;      // atlas u, v, w, h
    layout(location = 2) in vec4 instance;  // left, top, scale, variant
    uniform vec2 viewport;
    uniform vec2 atlasSize;
    uniform float variantStride;
    out vec2 uv;
    void main() {
      vec2 p = instance.xy + corner * cell.zw * instance.z;
      gl_Position = vec4(p / viewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
      uv = (cell.xy + vec2(0.0, instance.w * variantStride) + corner * cell.zw) / atlasSize;
    }`;
  let fs = `#version 300 es
    precision mediump float;
    uniform sampler2D atlas;
    in vec2 uv;
    out vec4 color;
    void main() {
      color = vec4(0.0, 0.0, 0.0, texture(atlas, uv).r);
    }`;
  let compile = (type, src) => {
    let s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  let uniforms = {};
  for (let name of ["viewport", "atlasSize", "variantStride", "atlas"]) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, atlas.width, atlas.height, 0, gl.RED, gl.UNSIGNED_BYTE, atlas.coverage);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  let cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let cellBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cellBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  let instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(2, 1);
  gl.bindVertexArray(null);

  return {
    setCells(chars) {
      let cells = new Float32Array(chars.length * 4);
      chars.forEach((c, n) => cells.set([c.glyph.u, c.glyph.v, c.glyph.w, c.glyph.h], n * 4));
      gl.bindBuffer(gl.ARRAY_BUFFER, cellBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cells, gl.STATIC_DRAW);
    },
    draw(data, count) {
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

      // p5 owns this context too, so set every piece of state we rely on.
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.CULL_FACE);
      gl.colorMask(true, true, true, true);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform2f(uniforms.viewport, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(uniforms.atlasSize, atlas.width, atlas.height);
      gl.uniform1f(uniforms.variantStride, atlas.blockH);
      gl.uniform1i(uniforms.atlas, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.bindVertexArray(null);
    },
  };
}
