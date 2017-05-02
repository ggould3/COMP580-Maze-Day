function redraw(){
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  environment();
  targets();
  cone();

  // Trigger event telling referee that frame has changed
  onRedraw();
}

function environment(){
  if(view == VIEW_PERIPHERAL){
    peripheralEnvironment();
    return;
  }else if(view == VIEW_NONE){
    noneEnvironment();
    return;
  }

  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(ORIGIN.x+SOUND_RADIUS,ORIGIN.y);
    ctx.arc(ORIGIN.x, ORIGIN.y, SOUND_RADIUS, 0, Math.PI * 2, true);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(ORIGIN.x+10, ORIGIN.y);
    ctx.arc(ORIGIN.x, ORIGIN.y, 15, 0, Math.PI*2, true);
    ctx.fillStyle = '#7BAFD4';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    for(i=0; i<stars.length; i++){
      ctx.moveTo(stars[i].x,stars[i].y);
      ctx.arc(stars[i].x,stars[i].y, 1, 0, Math.PI*2, false);
    }
    ctx.fillStyle = '#eeeeee';
    ctx.fill();
    ctx.closePath();
  }

  score('white');
}

function peripheralEnvironment(){
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(ORIGIN.x+40,ORIGIN.y);
    ctx.arc(ORIGIN.x, ORIGIN.y, 40, 0, 2*Math.PI, false);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();

  }
}

function noneEnvironment(){
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.closePath();
  }
}

function score(color){
  // score overlay on canvas
  if (color == null){
    color = "black";
  }

  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.font = "30px Arial";
    ctx.fillText(game.score,10,30);
    ctx.closePath();
  }
}

function cone(){
  if(view == VIEW_PERIPHERAL){
    peripheralCone();
    return;
  }else if(view == VIEW_NONE){
    return;
  }

  var origin = listener.pos;
  var r = 200;
  var theta = listener.dir;


  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    //ctx.lineTo(origin.x + r * Math.cos(theta), origin.y + r * Math.sin(theta));
    ctx.arc(origin.x, origin.y, r, theta - Math.PI/16, theta + Math.PI/16, false);
    ctx.lineTo(origin.x,origin.y);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    //ctx.stroke();
    ctx.closePath();
  }
}

function peripheralCone(){
  var origin = listener.pos;
  var theta = 3*Math.PI/2;
  var r = canvas.height;

  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    //ctx.lineTo(origin.x + r * Math.cos(theta), origin.y + r * Math.sin(theta));
    ctx.arc(origin.x, origin.y, r, theta - Math.PI/8, theta + Math.PI/8, false);
    ctx.lineTo(origin.x,origin.y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    //ctx.stroke();
    ctx.closePath();
  }
}

function mark(source){
  if(view == VIEW_PERIPHERAL){
    peripheralMark(source);
    return;
  }else if(view == VIEW_NONE){
    return;
  }

  var point = source.pos;
  // Defaults
  var fillStyle = 'red';
  var strokeStyle = 'red';
  var sizeR = 5;
  var shape = 'circle';

  if(source.type == ASTEROID){
    fillStyle = 'brown';
    var sizeR = 10;
  }else if(source.type == LASER){
    fillStyle = 'orange';
    sizeR = 5;
    var shape = 'projectile';
  }

  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();

    if(shape == 'circle'){
      ctx.moveTo(point.x, point.y);
      ctx.arc(point.x, point.y, sizeR, 0, Math.PI*2, false);
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }else if(shape == 'projectile'){
      var tail = trig(point, source.dir-Math.PI, 10);
      ctx.moveTo(tail.x, tail.y);
      ctx.arc(point.x, point.y, sizeR, source.dir-Math.PI/2, source.dir+Math.PI/2, false);
      ctx.moveTo(tail.x, tail.y);
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    ctx.closePath();
  }
}

function peripheralMark(source){
  var viewDir = 3*Math.PI/2;
  var shape = "circle";

  if(source.type == ASTEROID){
    var shape = "wave"
    fillStyle = 'brown';
    var sizeR = 10;
    var relativeDir = viewDir-listener.dir+(source.dir+Math.PI);
  }else if(source.type == LASER){
    fillStyle = 'orange';
    sizeR = 25;
    var relativeDir = viewDir-listener.dir+source.dir;
  }

  var dist = distance(listener.pos, source.pos);
  var point = trig(listener.pos, relativeDir, dist);

  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    if(shape == "circle"){
      ctx.moveTo(point.x, point.y);
      ctx.arc(point.x, point.y, sizeR, 0, Math.PI*2, false);
      var grd = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, sizeR);
      grd.addColorStop(0,'lightgreen');
      grd.addColorStop(1,'transparent');
      ctx.fillStyle = grd;
      ctx.fill();
    }else if(shape == "wave"){
      var waveOrigin = trig(point, relativeDir, canvas.width);
      ctx.moveTo(waveOrigin.x, waveOrigin.y);
      var waveRadius = distance(waveOrigin, point);
      var drawDistance = distance(ORIGIN, new Point(0,0,0));
      ctx.arc(waveOrigin.x, waveOrigin.y, waveRadius, relativeDir+Math.PI/2, relativeDir-Math.PI/2, false);
      var grd = ctx.createRadialGradient(waveOrigin.x,waveOrigin.y,canvas.width/2,waveOrigin.x,waveOrigin.y,waveRadius);
      grd.addColorStop(0,"red");
      grd.addColorStop(1,"transparent");
      ctx.fillStyle = grd;
      ctx.fill();
    }

    ctx.closePath();
  }
}

function targets(){
  sourceMap.draw();
}
