// game parameters
const PADDLE_WIDTH = 0.1; // as a fraction of the screen width
const PADDLE_SPEED = 0.5; // fraction of screen width per second -> it will cross 50% of the screen in 1s
const BALL_SPEED = 0.45; // fraction of screen height per second
const BALL_SPIN = 0.2; // ball deflection of the paddle 0 == no spin, 1 == high spin
const WALL = 0.02; // wall-ball-paddle size as a fraction of the shortest screen dimension
const MIN_BOUNCE_ANGLE = 30; // min bounce angle from the horizontal in degrees
const BRICK_ROWS = 8; // starting number of brick rows
const BRICK_COLS = 14; // original number of brick cols
const BRICK_GAP = 0.3; // brick gap as a fraction of wall width
const MARGIN = 4; // number of empty rows above the bricks - empty spavce b/t the top of the bricks and the score board
const MAX_LEVEL = 10; // max game level (+2 rows of bricks per level)
const MIN_BOUNCE_ANGLE = 30; // min bounce angle from the horizontal in degrees

// colors
const COLOR_BG = "black";
const COLOR_WALL = "grey";
const COLOR_PADDLE = "white";
const COLOR_BALL = "white";

// directions
const DIRECTION = {
  LEFT: 0,
  RIGHT: 1,
  STOP: 2,
};

// setting up the canvas and context
let canvasEl = document.createElement("canvas");
document.body.appendChild(canvasEl);
const ConX = canvasEl.getContext("2d");

// dimensions
let width, height, wall;

//

// initializing the paddle, ball classes
let paddle,
  ball,
  touchX,
  bricks = [],
  level; // touch location

// touch events
canvasEl.addEventListener("touchcancel", touchCancel);
canvasEl.addEventListener("touchend", touchEnd);
canvasEl.addEventListener("touchmove", touchMove, { passive: true });
canvasEl.addEventListener("touchstart", touchStart, { passive: true });

// arrow key event
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// ============================= Resize window event ====================================
window.addEventListener("resize", setDimensions);

// ============================= The Game Loop ====================================
function playGame() {
  requestAnimationFrame(playGame);

  // update functions
  updatePaddle();
  updateBall();

  // draw function
  drawBackground();
  drawWalls();
  drawPaddle();
  drawBricks();
  drawBall();
}

// ============================= applyBallSpeed function ====================================
function applyBallSpeed(angle) {
  // keeping the angle between 2 limits - (30-150)degree
  //   console.log("angle1;", (angle / Math.PI) * 180);

  if (angle < Math.PI / 6) {
    angle = Math.PI / 6;
  } else if (angle > (Math.PI * 5) / 6) {
    angle = (Math.PI * 5) / 6;
  }
  //   console.log("angle2;", (angle / Math.PI) * 180);

  ball.xV = ball.speed * Math.cos(angle);
  ball.yV = -ball.speed * Math.sin(angle);
}

// ============================= createBricks function ====================================
function createBricks() {
  // row dimensions
  let minY = wall;
  let maxY = ball.y - ball.h * 3.5;
  let totalSpaceY = maxY - minY;
  let totalRows = MARGIN + BRICK_ROWS + MAX_LEVEL * 2;
  let rowH = (totalSpaceY / totalRows) * 0.9;
  let gap = wall * BRICK_GAP * 0.9;
  let h = rowH - gap;

  // col dimensions
  let totalSpaceX = width - wall * 2;
  let colW = (totalSpaceX - gap) / BRICK_COLS;
  let w = colW - gap;

  // resetting bricks array
  bricks = [];
  let cols = BRICK_COLS;
  let rows = BRICK_ROWS + level * 2;
  let coloe, left, rank, rankHigh, score, spdMult, top;

  rankHigh = rows / 2 - 1;
  for (let i = 0; i < rows; i++) {
    bricks[i] = [];
    rank = Math.floor(i / 2);
    color = getBrickColor(rank, rankHigh);
    top = wall + (MARGIN + i) * rowH;
    for (let j = 0; j < cols; j++) {
      left = wall + gap + j * colW;
      bricks[i][j] = new Brick(left, top, w, h, color);
    }
  }
}

// ============================= drawBackground function ====================================
function drawBackground() {
  ConX.fillStyle = COLOR_BG;
  ConX.fillRect(0, 0, canvasEl.width, canvasEl.height);
}

// ============================= drawBall function ====================================
function drawBall() {
  ConX.fillStyle = COLOR_BALL;
  ConX.fillRect(ball.x - ball.w / 2, ball.y - ball.h / 2, ball.w, ball.h);
}

// ============================= drawBricks function ====================================
function drawBricks() {
  for (let row of bricks) {
    for (let brick of row) {
      ConX.fillStyle = brick.color;
      ConX.fillRect(brick.left, brick.top, brick.w, brick.h);
    }
  }
}

// ============================= drawPaddle function ====================================
function drawPaddle() {
  ConX.fillStyle = COLOR_PADDLE;
  ConX.fillRect(
    paddle.x - paddle.w * 0.5,
    paddle.y - paddle.h / 2,
    paddle.w,
    paddle.h
  );
}

// ============================= drawWalls function ====================================
function drawWalls() {
  let halfWall = wall * 0.5;
  ConX.lineWidth = wall;
  ConX.strokeStyle = COLOR_WALL;
  ConX.beginPath();
  ConX.moveTo(halfWall, height);
  ConX.lineTo(halfWall, halfWall);
  ConX.lineTo(width - halfWall, halfWall);
  ConX.lineTo(width - halfWall, height);
  ConX.stroke();
}

// ============================= getBrickColor function ====================================
function getBrickColor(rank, highestRank) {
  // red = 0, orange = 0.33, yellow = 0.67, green = 1
  let fraction = rank / highestRank;
  let r,
    g,
    b = 0;

  // red to orange to yellow (increase the green)
  if (fraction <= 0.67) {
    r = 255;
    g = (255 * fraction) / 0.67;
  }

  // yellow to green (reduce the red)
  else {
    r = (255 * (1 - fraction)) / 0.66;
    g = 255;
  }

  return `rgb(${r}, ${g},${b})`;
}

// ============================= Arrow keys function ====================================
function keyDown(e) {
  switch (e.keyCode) {
    case 32: // space key => to serve the ball
      serveBall();
      break;
    case 37: // left arrow => move paddle to left
      movePaddle(DIRECTION.LEFT);
      break;
    case 39: // right arrow => move paddle to right
      movePaddle(DIRECTION.RIGHT);
      break;
  }
}

function keyUp(e) {
  switch (e.keyCode) {
    case 37:
    case 39:
      movePaddle(DIRECTION.STOP);
      break;
  }
}

// ============================= movePaddle function ====================================
function movePaddle(direction) {
  switch (direction) {
    case DIRECTION.LEFT:
      paddle.xV = -paddle.speed;
      break;
    case DIRECTION.RIGHT:
      paddle.xV = paddle.speed;
      break;
    case DIRECTION.STOP:
      paddle.xV = 0;
      break;
  }
}

// ============================= new game function ====================================
function newGame() {
  paddle = new Paddle(PADDLE_WIDTH, wall, PADDLE_SPEED);
  ball = new Ball(wall, BALL_SPEED);

  level = 0;

  createBricks();
}

// ============================= serveBall functiion ====================================
function serveBall() {
  // if the ball is already moving, do not allow serve
  if (ball.yV != 0) {
    return false;
  }
  // random angle, not less than the min bouce angle
  let minBounceAngle = (MIN_BOUNCE_ANGLE / 180) * Math.PI; // radius
  let range = Math.PI - minBounceAngle * 2;
  let angle = Math.random() * range + minBounceAngle;
  applyBallSpeed(angle);

  return true;
}

// ============================= outOfBounds functiion ====================================
function outOfBounds() {
  newGame();
}

// ============================= setDimensions functiion ====================================
function setDimensions() {
  height = window.innerHeight;
  width = window.innerWidth;
  wall = WALL * (height < width ? height : width);
  canvasEl.width = width;
  canvasEl.height = height;

  newGame();
}

// ============================= touch events functiion ====================================

// touch function

// function touch(x) {
//   if (!x) {
//     movePaddle(DIRECTION.STOP);
//   } else if (x > paddle.x) {
//     movePaddle(DIRECTION.RIGHT);
//   } else if (x < paddle.x) {
//     movePaddle(DIRECTION.LEFT);
//   }
// }

function touchCancel() {
  touchX = null;
  movePaddle(DIRECTION.STOP);
}

function touchEnd() {
  touchX = null;
  movePaddle(DIRECTION.STOP);
}

function touchMove(e) {
  touchX = e.touches[0].clientX;
}

function touchStart(e) {
  if (serveBall()) {
    return;
  }
  touchX = e.touches[0].clientX;
}

// ============================= updateBall functiion ====================================
function updateBall() {
  // move the ball
  ball.x += (ball.xV / 1000) * 15;
  ball.y += (ball.yV / 1000) * 15;

  // bouncing the ball of the walls
  if (ball.x < wall + ball.w / 2) {
    ball.x = wall + ball.w / 2;
    ball.xV = -ball.xV;
    // spinBall();
  } else if (ball.x > canvasEl.width - wall - ball.w / 2) {
    ball.x = canvasEl.width - wall - ball.w / 2;
    ball.xV = -ball.xV;
    // spinBall();
  } else if (ball.y < wall + ball.h / 2) {
    ball.y = wall + ball.h / 2;
    ball.yV = -ball.yV;
    // spinBall();
  }

  // bouncing the ball of the paddle
  if (
    ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5 &&
    ball.y < paddle.y + paddle.h * 0.5 + ball.h * 0.5 &&
    ball.x > paddle.x - paddle.w * 0.5 - ball.w * 0.5 &&
    ball.x < paddle.x + paddle.w * 0.5 + ball.w * 0.5
  ) {
    ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5;
    ball.yV = -ball.yV;

    // modify the angle based off the ball spin
    // find the current angle
    let angle = Math.atan2(-ball.yV, ball.xV);
    angle += ((Math.random() * Math.PI) / 2 - Math.PI / 4) * BALL_SPIN;
    applyBallSpeed(angle);
  }

  // ball moves out of the canvas
  if (ball.y > canvasEl.height) {
    outOfBounds();
  }

  // move the ball with paddle
  if (ball.yV == 0) {
    ball.x = paddle.x;
  }
}

// ============================= updatePaddle functiion ====================================
function updatePaddle() {
  // move the paddle with touch
  if (touchX != null) {
    if (touchX > paddle.x + wall) {
      movePaddle(DIRECTION.RIGHT);
    } else if (touchX < paddle.x - wall) {
      movePaddle(DIRECTION.LEFT);
    } else {
      movePaddle(DIRECTION.STOP);
    }
  }

  // move the paddle
  paddle.x += (paddle.xV / 1000) * 20;

  // wall collision detection for paddle
  if (paddle.x < wall + paddle.w / 2) {
    paddle.x = wall + paddle.w / 2;
  } else if (paddle.x > canvasEl.width - wall - paddle.w / 2) {
    paddle.x = canvasEl.width - wall - paddle.w / 2;
  }
}

// the ball class
class Ball {
  constructor(ballSize, ballSpeed) {
    this.w = ballSize;
    this.h = ballSize;
    this.x = paddle.x;
    this.y = paddle.y - paddle.h / 2 - this.h / 2;
    this.speed = ballSpeed * height;
    this.xV = 0;
    this.yV = 0;
  }
}

// brick class
class Brick {
  constructor(left, top, w, h, color, score, spdMult) {
    this.w = w;
    this.h = h;
    this.left = left;
    this.top = top;
    this.bottom = top + h;
    this.right = left + w;
    this.color = color;
    // this.score = score;
    // this.spdMult = spdMult;
  }
}

// the paddle class
class Paddle {
  constructor(paddleWidth, paddleHeight, paddleSpeed) {
    this.w = paddleWidth * width;
    this.h = paddleHeight / 2;
    this.x = canvasEl.width / 2;
    this.y = canvasEl.height - this.h * 3;
    this.speed = paddleSpeed * width;
    this.xV = 0;
  }
}

setDimensions();

playGame();
