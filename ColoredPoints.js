// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    // gl_PointSize = 20.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

let g_fillGap = false;  // fill gap mode is off initially
let lastMousePos = null;


function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablestoGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 3;

// globals related to UI elements
let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType=POINT;
let g_selectedSegments = 10;

// set up actions for the HTML UI elements
function addActionsForHtmlUI() {

  // button events (shape type)
  //document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
//  document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

  document.getElementById('redSlide').addEventListener('mouseup', function () { g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function () { g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function () { g_selectedColor[2] = this.value/100; });

  document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectedSize = this.value; });

  document.getElementById('segmentsSlide').addEventListener('mouseup', function () { g_selectedSegments = this.value; });

  document.getElementById('drawPictureButton').onclick = function() { drawPicture(); };

  document.getElementById('fillGapButton').onclick = function() { g_fillGap = !g_fillGap; };



}

function main() {
  // set up canvas and gl variables
  setupWebGL();
  // set up GLSL shader programs and connect GLSL variables
  connectVariablestoGLSL();

  // set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };

   canvas.onmouseup = function() {
   lastMousePos = null;
 };


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

}


var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = []; // the array to store the size of a point

function click(ev) {

  // extract the event click and return it in WebGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev);

  // if fill gap mode is turned on and there is a previous mouse position, draw a line between them
  if (g_fillGap) {
    if (lastMousePos !== null) {
      // create a new Line object between the last position and the current position
      let line = new Line(lastMousePos[0], lastMousePos[1], x, y, g_selectedColor, g_selectedSize);
      g_shapesList.push(line);
    }
    // update last mouse position
    lastMousePos = [x, y];
  }

  // create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  }
  else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  }
  else {
    point = new Circle();
    point.segments = g_selectedSegments; // set number of segments per the slider
  }
  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  // draw every shape that is supposed to be in the canvas
  renderAllShapes();


}

// extract the event click and return it in webGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}

// draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // var len = g_points.length;
  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {

    g_shapesList[i].render();

  }
}

function drawPicture() {
  // Clear the canvas first, if desired
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform4f(u_FragColor,0.5, 0.8, 0.9, 1.0);
  drawTriangle([-1, -1,   -1, 1,   1, -1]);
  drawTriangle([-1, 1,   1, 1,   1, -1]);




  // Set the uniform color to a medium gray.
  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0);

  drawTriangle([-0.9, -0.2,   -0.5, 0.7,   0.3, -0.2]);
  drawTriangle([-0.5, -0.2,   0.0, 0.6,   0.5, -0.2]);
  drawTriangle([-0.1, -0.2,   0.3, 0.5,   0.9, -0.2]);


  // grass
  gl.uniform4f(u_FragColor, 0.1, 0.5, 0.1, 1.0);

  drawTriangle([-1, -0.2,   -1, -1,   1, -1]);
  drawTriangle([-1, -0.2,   1, -1,   1, -0.2]);


  gl.uniform4f(u_FragColor, 0.4, 0.2, 0.1, 1.0);

  // trees
  drawTriangle([-0.5, -0.8,   -0.5, -0.6,   -0.35, -0.8]);
  drawTriangle([-0.35, -0.6,   -0.5, -0.6,   -0.35, -0.8]);

  drawTriangle([0.45, -0.6,   0.55, -0.6,   0.55, -0.7]);
  drawTriangle([0.45, -0.6,   0.45, -0.7,   0.55, -0.7]);

  gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0);
  drawTriangle([0.3, -0.6,   0.7, -0.6,   0.5, -0.4]);
  drawTriangle([0.35, -0.45,   0.65, -0.45,   0.5, -0.3]);
  drawTriangle([0.425, -0.35,   0.575, -0.35,   0.5, -0.25]);

  drawTriangle([-0.7, -0.6,   -0.1, -0.6,   -0.4, -0.3]);
  drawTriangle([-0.6, -0.4,   -0.2, -0.4,   -0.4, -0.1]);
  drawTriangle([-0.5, -0.2,   -0.3, -0.2,   -0.4, -0.05]);

  // sun
  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);

  drawTriangle([0.7, 0.7,   0.9, 0.7,   0.9, 0.8]);
  drawTriangle([0.7, 0.7,   0.9, 0.7,   0.9, 0.6]);

  drawTriangle([0.7, 0.7,   0.5, 0.7,   0.5, 0.8]);
  drawTriangle([0.7, 0.7,   0.5, 0.7,   0.5, 0.6]);

  drawTriangle([0.7, 0.7,   0.7, 0.9,   0.6, 0.9]);
  drawTriangle([0.7, 0.7,   0.7, 0.9,   0.8, 0.9]);

  drawTriangle([0.7, 0.7,   0.7, 0.5,   0.6, 0.5]);
  drawTriangle([0.7, 0.7,   0.7, 0.5,   0.8, 0.5]);

  drawTriangle([0.7, 0.7,   0.9, 0.8,   0.8, 0.9]);
  drawTriangle([0.7, 0.7,   0.5, 0.8,   0.6, 0.9]);

  drawTriangle([0.7, 0.7,   0.5, 0.6,   0.6, 0.5]);
  drawTriangle([0.7, 0.7,   0.9, 0.6,   0.8, 0.5]);

}

class Line {
  constructor(x1, y1, x2, y2, color, size) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color.slice();
    this.size = size;
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    let vertices = new Float32Array([this.x1, this.y1, this.x2, this.y2]);
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object for line');
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.LINES, 0, 2);
  }
}
