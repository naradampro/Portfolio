//optimal image size for this game is 400x400
const imgPath = "src/img/puzzle400.jpg";
const divisionOneSide = 3;

const divisionX = divisionOneSide;
const divisionY = divisionOneSide;

let imgHeight = 0;
let imgWidth = 0;
let resolutionX = 0;
let resolutionY = 0;
let numberOfSquares = 0;
let initialEmptySqureLocation = 0;
let imageSegments = [];
let moves = 0;

let puzzleState = {
  emptySquare: null,
  activeSquares: null,
  locations: {},
};
let solutionState = {};
function initGlobalValues(height, width) {
  imgHeight = height;
  imgWidth = width;
  resolutionX = imgWidth / divisionX;
  resolutionY = imgHeight / divisionY;
  numberOfSquares = divisionX * divisionY;
  initialEmptySqureLocation = divisionX * divisionY;
  imageSegments = getImageSegments();
  solutionState = getSolutionPuzzleState();
}

function getImageData(imgPath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imgPath;
    img.onload = () =>
      resolve({
        width: img.width,
        height: img.height,
      });
    img.onerror = () => reject();
  });
}

function getImageSegments() {
  const segmentsArray = [];
  let count = 0;
  let left = 0;
  let top = 0;
  for (let i = imgWidth; i > 0; i -= resolutionX) {
    for (let j = imgHeight; j > 0; j -= resolutionY) {
      count++;
      top = i == imgWidth ? 0 : i;
      left = j == imgHeight ? 0 : j;
      segmentsArray.push({
        id: count,
        bgPositionX: left,
        bgPositionY: top,
      });
    }
  }
  segmentsArray.pop();
  return segmentsArray;
}

function getImageSegmentById(id) {
  if (id > imageSegments.length || id <= 0) {
    throw new Error("Index out of range.");
  }
  return imageSegments[id - 1];
}

function getPosibleMoves(position) {
  const possibilityArray = [];
  const moves = [
    position - 1,
    position + 1,
    position - divisionOneSide,
    position + divisionOneSide,
  ];
  moves.forEach((move) => {
    if (isBetweenValidRange(position, move, numberOfSquares)) {
      possibilityArray.push(move);
    }
  });
  return possibilityArray;
}

function isBetweenValidRange(position, value, numberOfSquares) {
  if (
    value > 0 &&
    value <= numberOfSquares &&
    !(value % divisionOneSide == 0 && position - 1 == value) &&
    !(position % divisionOneSide == 0 && position + 1 == value)
  ) {
    return true;
  }
  return false;
}

function getSolutionPuzzleState() {
  const solutionState = {
    emptySquare: initialEmptySqureLocation,
    activeSquares: getPosibleMoves(initialEmptySqureLocation),
    locations: {},
  };

  for (let i = 0; i < numberOfSquares - 1; i++) {
    solutionState.locations["sq" + (i + 1)] = i + 1;
  }

  solutionState.locations["sq" + initialEmptySqureLocation] = 0;
  return solutionState;
}

function generateGrid() {
  let count = 0;
  let html = "";
  for (let i = 0; i < divisionY; i++) {
    let row = '<div class="gridsquare-row">';
    for (let j = 0; j < divisionX; j++) {
      count++;
      row += `<div class="gridsquare bg-white" style="min-width: ${resolutionX}px;height: ${resolutionY}px;" id="sq${count}"></div>`;
    }
    html += row + "</div>";
  }
  return html;
}

function generateImageSegmentElement(imageSegment) {
  return `<div class="imgSegment" id="imgSegment${imageSegment.id}" style="background: url(${imgPath}); background-position: ${imageSegment.bgPositionX}px ${imageSegment.bgPositionY}px;"></div>`;
}

function displayGrid() {
  $("#puzzle-container").html(generateGrid());
}

function shuffleThePuzzle() {
  const remainingSegments = [...imageSegments];
  const length = remainingSegments.length;

  puzzleState.emptySquare = initialEmptySqureLocation;
  puzzleState.activeSquares = getPosibleMoves(initialEmptySqureLocation);

  moves = 0;
  $("#moves-count").html("Moves : <strong>" + moves + "</strong>");
  $("#show-solution").removeAttr("disabled");
  $("#shuffle").text("Shuffle");
  $("#puzzle-container").empty();
  displayGrid();

  $("#sq" + initialEmptySqureLocation).empty();
  for (let i = 0; i < length; i++) {
    let randomPosition = (Math.random() * remainingSegments.length) | 0;
    puzzleState.locations["sq" + (i + 1)] =
      remainingSegments[randomPosition].id;
    $("#sq" + (i + 1)).html(
      generateImageSegmentElement(remainingSegments[randomPosition])
    );
    remainingSegments.splice(randomPosition, 1);
  }
  puzzleState.locations["sq" + initialEmptySqureLocation] = 0;
  puzzleState.activeSquares.forEach((id) => {
    $("#sq" + id + " div")
      .attr({
        draggable: "true",
        ondragstart: "drag(event," + id + ")",
      })
      .css({ cursor: "grab" });
  });
}

function showSolution() {
  moves = 0;
  $("#puzzle-container").empty();
  displayGrid();
  $("#moves-count").empty();
  $("#show-solution").attr("disabled", "true");
  $("#shuffle").text("Play");
  $("#moves-count").html("Your solution should be similar to this.");
  for (let i = 0; i < imageSegments.length; i++) {
    $("#sq" + (i + 1)).html(generateImageSegmentElement(imageSegments[i]));
  }
  puzzleState = getSolutionPuzzleState();
  puzzleState.locations["sq" + initialEmptySqureLocation] = 0;
  $("#sq" + initialEmptySqureLocation).empty();
}

function displayWinMessage(moves) {
  $("#moves-count").html(
    "Congratulations!! You have successfully solved the puzzle. with " +
      moves +
      " moves."
  );
  $("#show-solution").attr("disabled", "true");
  $(".gridsquare").removeAttr("onClick");
  $("#shuffle").text("Play Again");
}

function allowDrop(event) {
  event.preventDefault();
}

function drag(event, id) {
  event.dataTransfer.setData("imageSegmentId", event.target.id);
  event.dataTransfer.setData("squareId", id);
  $("#sq" + puzzleState.emptySquare).attr({
    ondrop: "drop(event)",
    ondragover: "allowDrop(event)",
  });
}

function drop(event) {
  event.preventDefault();
  const squareId = parseInt(event.dataTransfer.getData("squareId"));
  const imageSegmentId = parseInt(
    event.dataTransfer.getData("imageSegmentId").substring(10)
  );
  const emptySquare = puzzleState.emptySquare;
  moves++;
  //ui change
  let imageSegment = $("#sq" + squareId).html();
  $("#sq" + squareId).empty();
  $("#sq" + emptySquare).html(imageSegment);
  $("#moves-count").html("Moves : <strong>" + moves + "</strong>");
  $(".imgSegment").removeAttr("draggable");
  $(".imgSegment").removeAttr("ondragstart");
  $(".gridsquare").removeAttr("ondrop");
  $(".gridsquare").removeAttr("ondragover");
  $(".imgSegment").css({ cursor: "not-allowed" });

  //state change
  puzzleState.emptySquare = squareId;
  puzzleState.activeSquares = getPosibleMoves(squareId);
  puzzleState.locations["sq" + emptySquare] = imageSegmentId;
  puzzleState.locations["sq" + squareId] = 0;

  //after state change
  puzzleState.activeSquares.forEach((id) => {
    $("#sq" + id + " div")
      .attr({
        draggable: "true",
        ondragstart: "drag(event," + id + ")",
      })
      .css({ cursor: "grab" });
  });

  if (JSON.stringify(puzzleState) === JSON.stringify(solutionState)) {
    displayWinMessage(moves);
    $(".imgSegment").removeAttr("draggable");
    $(".imgSegment").removeAttr("ondragstart");
    $(".gridsquare").removeAttr("ondrop");
    $(".gridsquare").removeAttr("ondragover");
    $(".imgSegment").css({ cursor: "not-allowed" });
  }
}

async function initPuzzle() {
  let imgData = await getImageData(imgPath);

  initGlobalValues(imgData.width, imgData.height);

  displayGrid();
  shuffleThePuzzle();
  $("#moves-count").html("Welcome!! Let's play.");
}

initPuzzle();
