const WIDTH = 800;
const HEIGHT = 600;
const PAPER = Snap("#svg-view");
var panZoom = null;
var activeWeft = null;

function weave() {
  var file = null;
  var width = null;
  var heddles = null;
  var bgColor = null;
  var warpColor = null;
  var weftColor = null;

  var files = document.getElementById("files");
  if ("files" in files && files.files.length > 0) {
    file = files.files[0];
  }

  var widthInput = document.getElementById("width").value;
  if (widthInput != "") {
    width = parseInt(widthInput);
  }

  var heddlesInput = document.getElementById("heddles").value;
  if (heddlesInput != "") {
    heddles = parseInt(heddlesInput);
  }

  var bgColorInput = document.getElementById("background-color").value;
  if (bgColorInput != "") {
    bgColor = bgColorInput;
  }

  var warpColorInput = document.getElementById("warp-color").value;
  if (warpColorInput != "") {
    warpColor = warpColorInput;
  }

  var weftColorInput = document.getElementById("weft-color").value;
  if (weftColorInput != "") {
    weftColor = weftColorInput
  }

  if (file == null) {
    alert("Please choose a file to create a weave.");
    return;
  }
  if (width == null || width < 1 || width > 128) {
    alert("Please input a width between 1 and 128");
    return;
  }
  if (heddles == null || heddles < 1 || heddles > width) {
    alert("Please input a number of heddles between 1 and the width");
    return;
  }
  if (bgColor == null) {
    alert("Please input a background color.");
    return;
  }
  if (warpColor == null) {
    alert("Please input a warp color.");
    return;
  }
  if (weftColor == null) {
    alert("Please input a weft color.");
    return;
  }

  var reader = new FileReader();
  reader.onload = function() {
    console.log("read");
    if (activeWeft != null) {
      activeWeft.stop();
    }
    if (panZoom != null) {
      panZoom.destroy();
    }
    PAPER.clear();
    renderWeave(heddles,
                width,
                generateBinary(this.result),
                this.result.byteLength,
                bgColor,
                warpColor,
                weftColor);
  }
  console.log("reading");
  reader.readAsArrayBuffer(file);
}

function* generateBinary(buf) {
  for (var uint8 of new Uint8Array(buf)) {
    var mask = 1 << 7;
    while (mask > 0) {
      yield ((uint8 & mask) > 0 ? 1 : 0);
      mask = mask >>> 1;
    }
  }
}

function renderWeave(heddles, width, binary, byteLength, bgColor, warpColor, weftColor) {
  console.log("starting render");
  var yarnWidth = WIDTH / ((width * 2) + 5);
  var warp = generateWarp(width, warpColor, heddles, byteLength);
  console.log("warp done");
  var weftPath = generateWeftPath(width, heddles, byteLength);
  console.log("weft done");
  var weftLength = Snap.path.getTotalLength(weftPath);
  console.log("weft length");
  var weft = PAPER.path({
    path: Snap.path.getSubpath(weftPath, 0, 0),
    stroke: weftColor,
    strokeWidth: yarnWidth,
    strokeLinecap: "round",
    fillOpacity: 0
  });
  console.log("weft path");
  var mask = generateMask(width, heddles, binary, warpColor);
  console.log("mask done");

  console.log("starting stroke animation");

  document.body.style.backgroundColor = bgColor;
  panZoom = svgPanZoom("#svg-view");

  Snap.animate(0, weftLength,
    function(step){ //step function
      weft.attr({
        path: Snap.path.getSubpath(weftPath, 0, step)
      });
    },
    10000, //duration
    mina.easeInOut, //easing
    function(){ console.log("done"); }
  ); //callback
}

function generateWarp(width, color, heddles, byteLength) {
  var warp = PAPER.g();
  var numRows = Math.ceil((byteLength * 8) / heddles);
  var yarnWidth = WIDTH / ((width * 2) + 5);
  var x = yarnWidth * (2 + 1.5);
  for (var i = 0; i < width; i++) {
    var line = PAPER.line(x, HEIGHT, x, HEIGHT - ((yarnWidth * 2 * numRows) + yarnWidth));
    line.attr({
      stroke: color,
      strokeWidth: yarnWidth
    });
    warp.add(line);
    x += yarnWidth * 2;
  }
  return warp;
}

function generateWeftPath(width, heddles, byteLength) {
  var numRows = Math.ceil((byteLength * 8) / heddles);
  var yarnWidth = WIDTH / ((width * 2) + 5);
  var path = `M 0 ${HEIGHT - (yarnWidth * 1.5)}`;
  for (var i = 0; i < numRows; i++) {
    let x = (i % 2) == 0 ? WIDTH - (yarnWidth * 2) : (yarnWidth * 2);
    let y = HEIGHT - (yarnWidth * (i*2 + 1.5));
    let sweep = i % 2;
    path += ` L ${x} ${y}`;
    path += ` A 1 1 0 0 ${sweep} ${x} ${y - (yarnWidth * 2)}`;
  }
  return path;
}

function generateMask(width, heddles, binary, color) {
  var yarnWidth = WIDTH / ((width * 2) + 5);
  var mask = PAPER.g();
  var y = HEIGHT - (yarnWidth * 1.5);
  var i = 0;
  //var p = ""
  for (var bit of binary) {
    //p += bit;
    if (bit == 1) {
      for (var j = i % heddles; j < width; j += heddles) {
        var x = (yarnWidth * 3) + (j * yarnWidth * 2);
        line = PAPER.line(x, y, x + yarnWidth, y);
        line.attr({
          stroke: color,
          strokeWidth: yarnWidth + 1
        });
        mask.add(line);
      }
    }
    i++;
    if (i % heddles == 0) {
      y -= yarnWidth * 2;
      //console.log(p);
      //p = "";
    }
  }
  return mask;
}

function hide(icon) {
  $("#controls").slideUp(400, () => {
    icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
  });
}

function show(icon) {
  $("#controls").slideDown(400, () => {
    icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
  });
}

function play(icon) {
  icon.removeClass("fa-play").addClass("fa-pause");
}

function pause(icon) {
  icon.removeClass("fa-pause").addClass("fa-play");
}

$(document).ready(() => {

  $("#weave-btn").click(() => {
    hide($("#show-hide").find(".fa"));
    weave();
  });

  $("#play-pause").click(() => {
    var icon = $("#play-pause").find(".fa");
    if (icon.hasClass("fa-play")) {
      play(icon);
    } else {
      pause(icon);
    }
  });

  $("#show-hide").click(() => {
    var icon = $("#show-hide").find(".fa");
    if (icon.hasClass("fa-chevron-down")) {
      show(icon);
    } else {
      hide(icon);
    }
  });

});
