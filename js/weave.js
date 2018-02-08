const WIDTH = 800;
const HEIGHT = 600;

function weave() {
  console.log("render!");
  var file = null;
  var width = null;
  var heddles = null;

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

  var reader = new FileReader();
  reader.onload = function() {
    renderWeave(heddles, width,
                generateBinary(this.result), this.result.byteLength);
  }
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

function renderWeave(heddles, width, binary, byteLength) {
  var s = Snap(WIDTH, HEIGHT);
  var yarnWidth = WIDTH / ((width * 2) + 1);
  var warp = generateWarp(s, width);
  var weftPath = generateWeftPath(s, width, heddles, byteLength);
  var weftLength = Snap.path.getTotalLength(weftPath);
  var weft = s.path({
    path: Snap.path.getSubpath(weftPath, 0, 0),
    stroke: "#c00",
    strokeWidth: yarnWidth,
    strokeLinecap: "round",
    fillOpacity: 0
  });
  var mask = generateMask(s, width, heddles, binary);

  console.log('starting stroke animation');
  Snap.animate(0, weftLength,
      function(step){ //step function
        console.log('step', step);
        weft.attr({
          path: Snap.path.getSubpath(weftPath, 0, step)
        });
      },
      byteLength * 10000, //duration
      mina.easeInOut, //easing
      function(){ console.log("done"); }); //callback
}

function generateWarp(s, width) {
  var warp = s.g();
  var yarnWidth = WIDTH / ((width * 2) + 1);
  for (var i = 0; i < width; i++) {
    var x = yarnWidth * (i*2 + 1.5);
    var line = s.line(x, 0, x, HEIGHT);
    line.attr({
      stroke: "#bada55",
      strokeWidth: yarnWidth
    });
    warp.add(line);
  }
  return warp;
}

function generateWeftPath(s, width, heddles, byteLength) {
  var numRows = Math.ceil((byteLength * 8) / heddles);
  var yarnWidth = WIDTH / ((width * 2) + 1);
  var path = `M 0 ${HEIGHT - (yarnWidth * 1.5)}`;
  for (var i = 0; i < numRows; i++) {
    var x = (i % 2) == 0 ? WIDTH + yarnWidth : 0 - yarnWidth;
    var y = HEIGHT - (yarnWidth * (i*2 + 1.5));
    path += ` L ${x} ${y} L ${x} ${y - (yarnWidth * 2)}`;
  }
  return path;
  /*
     var weft = s.path({
  //path: path,
  path: Snap.path.getSubpath(path, 0, 0),
  stroke: "#c00",
  strokeWidth: yarnWidth,
  strokeLinecap: "round",
  fillOpacity: 0
  });
  return { weft: weft, length: Snap.path.getTotalLength(path) };
  */
}

function generateMask(s, width, heddles, binary) {
  var yarnWidth = WIDTH / ((width * 2) + 1);
  var mask = s.g();
  var y = HEIGHT - (yarnWidth * 1.5);
  var i = 0;
  var p = ""
    for (var bit of binary) {
      p += bit;
      if (bit == 1) {
        for (var j = i % heddles; j < width; j += heddles) {
          var x = yarnWidth + (j * yarnWidth * 2);
          line = s.line(x, y, x + yarnWidth, y);
          line.attr({
            stroke: "#bada55",
            strokeWidth: yarnWidth + 1
          });
          mask.add(line);
        }
      }
      i++;
      if (i % heddles == 0) {
        y -= yarnWidth * 2;
        //console.log(p);
        p = "";
      }
    }
  return mask;
}

function getCurve(x1, y1, x2, y2, sweep) {
  return `M ${x1} ${y1} A 1 1 0 0 ${sweep} ${x2} ${y2}`;
}

console.log(getCurve(1,2,3,4,1));
/*
   var loop = "M200 400 A 1 1 0 0 1 600 200";

   var loopLength = Snap.path.getTotalLength(loop);

   var s = Snap(800, 600);

   circle = s.path({
   path: loop,
   fill: "#bada55"
   });

   circleOutline =  s.path({
//path: loop,
path: Snap.path.getSubpath(loop, 0, 0),
stroke: "#c00",
fillOpacity: 0,
strokeWidth: 0,
strokeLinecap: "round"
});

circle.click(function(e){
console.log('starting stroke animation');
Snap.animate(0, loopLength,
function(step){ //step function
console.log('step', step);

circleOutline.attr({
path: Snap.path.getSubpath(loop, 0, step),
strokeWidth: 6
});

}, // end of step function
800, //duration
mina.easeInOut, //easing
function(){ //callback
setTimeout(function(){
circleOutline.attr({
path: Snap.path.getSubpath(loop, 0, 0),
strokeWidth: 0
});
}, 1000);//setTimeout
}//callback
);//Snap.animate
});//click the circle


var svg = d3.select("svg"),
width = +svg.attr("width"),
height = +svg.attr("height");

var randomX = d3.randomNormal(width / 2, 80),
randomY = d3.randomNormal(height / 2, 80),
data = d3.range(2000).map(function() { return [randomX(), randomY()]; });

var g = svg.append("g");

var circle = g.selectAll("circle")
.data(data)
.enter().append("circle")
.attr("r", 2.5)
.attr("transform", function(d) { return "translate(" + d + ")"; });

svg.append("rect")
.attr("fill", "none")
.attr("pointer-events", "all")
.attr("width", width)
.attr("height", height)
.call(d3.zoom()
.scaleExtent([1, 8])
.on("zoom", zoom));

function zoom() {
  g.attr("transform", d3.event.transform);
}
*/
