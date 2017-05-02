// Globals Declarations
var ORIGIN;
var SOUND_RADIUS = 200;
var VIEW_DETAILED = 0;
var VIEW_PERIPHERAL = 1;
var VIEW_NONE = 2;
var DIFFICULTY_EASY = 1;
var DIFFICULTY_NORMAL = 2;
var DIFFICULTY_HARD = 3;

// Game Phases
var WAITING = 4000;
var ACTIVE = 4001;
var GAME_OVER = 4002;

// Source Type declarations
var NONE = 3000;
var ASTEROID = 3001;
var LASER = 3002;

// Game Modes
var ASTEROIDS_GAME = 2000;

var keys = [];
var listener;
var sourceMap = new SourceMap;
//HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
var canvas;
var view = VIEW_DETAILED;
var game = new Game(ASTEROIDS_GAME);

// Sound path variables
var asteroidSound = null;
var laserSound = null;
var explosionSound = null;
var lockonSound = null;

window.onload = function(){
  ORIGIN = getCenter("canvas");
  canvas = document.getElementById('canvas');
  generateStars();
  environment();
  setup();
  $('#controls').popover();
  cssCorrections();
}

function setup(){
  setListeners()
  listener = new Listener(ORIGIN, 3*Math.PI/2);
  redraw();
  asteroidReferee();
}

function Game(mode){
  this.mode = mode;
  this.status = WAITING;
  this.score = 0;
  this.hits = 0;
  this.time = {start: 0, end: 0};
  this.difficulty = DIFFICULTY_NORMAL;

  this.end = function(){
    clearObjects();
    this.status = GAME_OVER;
    this.time.end = new Date();
    // fields in game over pop-up
    $('#game_over_score').text(game.score);
    var dur = game.time.end - game.time.start;
    $('#game_over_time').text(msToTime(dur));
    $('#game_over_modal').modal('show');
    say("Game over, your score is "+game.score);
    // score based reactions
    if(game.score < 10){
      say("You let us down captain, we were counting on you");
    }else if(game.score < 50 && game.score >= 10){
      say("You did well, but not well enough it seems");
    }else if(game.score >= 50){
      say("You defended the ship with valor captain, well done");
    }

    resetWindow();
  }

  this.play = function(){
    this.status = ACTIVE;
    this.score = 0;
    this.hits = 0;
    gatherSounds();
    this.time.start = new Date();
    playAsteroids();
    update();
  }

  this.continue = function(){
    // allow more asteroids to spawn
    if(this.status != GAME_OVER){
      playAsteroids();
    }
  }
}

function getCenter(id){
  var element = $("#"+id);
  return new Point(element.width()/2, element.height()/2, 0);
}

function setListeners(){
  $(document).keydown(function(e){
    keys[e.keyCode] = true;

    if(e.which == 32 && e.target != document.input){ // spacebar
      var laser = new Laser();
      e.preventDefault();
    }
  })

  $(document).keyup(function(e){
    keys[e.keyCode] = false;
  });

  // $("#spawn").on("click", function(e){
  //   var angle = $("#spawn_angle").val();
  //   if(angle == ""){
  //     angle == 0;
  //   }
  //   var ast = new Asteroid(angle*Math.PI);
  // });

  $('#toggle_view').on('click', function(){
    view = (view + 1) % 3;
    $(this).text("View: "+getViewMode(view));
    redraw();
    $(this).blur();
  });

  $("#start_asteroids").on("click", function(e){
    $('#start_asteroids').prop('disabled', true);
    $('#start_asteroids').hide();
    $('#reset').show();
    $('#diff_dropdown').prop('disabled', true);
    $('#toggle_options').prop('disabled', true);
    game.play();
    $(this).blur();

    $('html, body').animate({
        scrollTop: $("#game_controls").offset().top
    }, 500);
  });

  $('#reset').on('click', function(){
    window.location.reload(false);
  });

  $('#reset_files').on('click', function(){
    $('#options_modal input').val([]);
  });

  $('#restart_asteroids').on('click', function(e){
    $('#start_asteroids').prop('disabled', true);
    $('#diff_dropdown').prop('disabled', true);
    game.play();
  });

  $('#diff_options li a').on('click', function(){
    $('#diff_options li').removeClass("active");
    $(this).parent().addClass("active");
    game.difficulty = $(this).data("diff")
  });

  $('#toggle_options').on('click', function(){
    $('#options_modal').modal("show");
  });

  $('#directions').on('click', function(){
    var intro = "You are the captain of the THSS, navigating an asteroid belt";
    var job = "Your task is to defend your ship from incoming asteroids";
    var ctrl1 = "When you hear an asteroid to your right, press the right arrow to rotate in that direction";
    var ctrl2 = "Rotate using the left arrow when you hear an asteroid to your left";
    var ctrl3 = "Press the space bar to fire the ship's laser when you line up the asteroid straight ahead";
    var ctrl4 = "After aiming directly at an asteroid, you will lock on and hear a tone, but this is not required to hit the target";
    var hit = "Hitting an asteroid will cause it to explode, boom";
    var end = ", Good luck captain";

    say(intro);
    say(job);
    say(ctrl1);
    say(ctrl2);
    say(ctrl3);
    say(ctrl4);
    say(hit);
    say(end);
  });
}

function Point(x,y,z){
  this.x = x;
  this.y = y;
  this.z = z;
}

function Listener(origin, radians){
    try{
      this.pos = origin
      this.dir = radians
    }catch(e){
      this.pos = new Point(0,0,0);
      this.dir = 0;
    }

    Howler.pos(this.pos.x, this.pos.y, this.pos.z);

    this.rotate = function(radians){
      this.dir += radians;
    }

    this.move = function(x, y, z){
      this.pos.x += x;
      this.pos.y += y;
      this.pos.z += z;
      Howler.pos(this.pos.x, this.pos.y, this.pos.z);
    }

}

function Source(pos, sound, type){
  this.pos = pos
  var vol = 0.5;
  var loop = false;

  if(type == ASTEROID){
    loop = true;
  }else if(type == LASER){
    vol = 0.1;
  }

  if(sound != null){
    this.file = soundFile(sound);
  }else{
    this.file = null;
  }
  this.node = new Node(this.pos, this.file, vol, loop);

  if(type != null){
    this.type = type;
  }else{
    this.type = NONE;
  }

  this.alive = true;
  this.speed = 0;
  this.dir = 0;

  this.play = function(){
    this.node.play();
  }

  this.stop = function(){
    this.node.stop();
  }

  this.move = function(x,y,z){
    this.pos.x += x;
    this.pos.y += y;
    this.pos.z += z;
    this.node.move(x,y,z);
  }

  this.moveTo = function(newPos){
    this.pos = newPos;
    this.node.moveTo(newPos);
  }

  this.draw = function(){
    mark(this);
  }

  this.destroy = function(){
    this.alive = false;
    // Leave audio node anging for now
    // See if this impacts performance
    this.stop();
    sourceMap.remove(this);
    //redraw();
    destroyEffects(this.pos, this.type);
    if(this.gamepiece != null){
      this.gamepiece.destroy();
    }
  }

  sourceMap.add(this);
}

function SourceMap(){
  this.sources = new Array();

  this.size = function(){
    return this.sources.length;
  }

  // Keep all sources
  this.add = function(source){
    this.sources.push(source);
  }

  this.remove = function(source){
    var ind = this.sources.indexOf(source);
    if( ind == -1){
      return;
    }else{
      this.sources.splice(ind, 1);
    }
  }

  this.draw = function(){
    for(i=0; i<this.sources.length; i++){
      this.sources[i].draw();
    }
  }
}

function gatherSounds(){
  // If user supplies sound files, overwrite default sound files
  asteroidSound = null;
  laserSound = null;
  explosionSound = null;
  lockonSound = null;

  if( document.getElementById("asteroid").files.length > 0 ){
    asteroidSound = URL.createObjectURL(document.getElementsByTagName('input')[0].files[0]);
  }
  if( document.getElementById("laser").files.length > 0 ){
    laserSound = URL.createObjectURL(document.getElementsByTagName('input')[1].files[0]);
  }
  if( document.getElementById("explosion").files.length > 0 ){
    explosionSound = URL.createObjectURL(document.getElementsByTagName('input')[2].files[0]);
  }
  if( document.getElementById("lockon").files.length > 0 ){
    lockonSound = URL.createObjectURL(document.getElementsByTagName('input')[3].files[0]);
  }

}

function say(string){
  var msg = new SpeechSynthesisUtterance(string);
  // var voices = window.speechSynthesis.getVoices();
  // msg.voice = voices[10]; // Note: some voices don't support altering params
  // msg.voiceURI = 'native';
  msg.volume = 0.7; // 0 to 1
  msg.rate = 0.9; // 0.1 to 10
  msg.pitch = 1.1; //0 to 2
  msg.lang = 'en-US';
  window.speechSynthesis.speak(msg);
}

function resetWindow(){
  $('#start_asteroids').prop('disabled', false);
  $('#diff_dropdown').prop('disabled', false);
  $('#toggle_options').prop('disabled', false);
  $('#start_asteroids').show();
  $('#reset').hide();
}

function clearObjects(){
  for(i=0; i<sourceMap.length; i++){
    sourceMap[i].destroy();
  }
}

//*************************************
// String Utilities
//*************************************
function getViewMode(mode){
  if(mode == VIEW_DETAILED){
    return "Detailed";
  }else if(mode == VIEW_PERIPHERAL){
    return "Peripheral";
  }else if(mode == VIEW_NONE){
    return "None";
  }else{
    return "Unknown";
  }
}

function msToTime(s) {
  // Pad to 2 or 3 digits, default is 2
  function pad(n, z) {
    z = z || 2;
    return ('00' + n).slice(-z);
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;

  return pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}

function cssCorrections(){
  var offset = $('#controls').outerWidth()+20;
  $('#header').css('padding-left', offset);

  var dirOffset = $('#directions').offset().top-20;
  // Fix button after scrolling past it
  $(window).scroll(function() {
      var currentScroll = $(window).scrollTop();
      if (currentScroll >= dirOffset) {
          $('#directions').css({
              position: 'fixed',
              top: '0',
              right: '0'
          });
      } else {
          $('#directions').css({
              position: 'static'
          });
      }
  });
}

//*************************************
// Calculations
//*************************************
// function relMouseCoords(event){
//     var totalOffsetX = 0;
//     var totalOffsetY = 0;
//     var canvasX = 0;
//     var canvasY = 0;
//     var currentElement = this;
//
//     do{
//         totalOffsetX += currentElement.offsetLeft;//- currentElement.scrollLeft;
//         totalOffsetY += currentElement.offsetTop;//- currentElement.scrollTop;
//     }
//     while(currentElement = currentElement.offsetParent)
//
//     canvasX = event.pageX - totalOffsetX;
//     canvasY = event.pageY - totalOffsetY;
//
//     return new Point(canvasX, canvasY, 0);
// }

function trig(start, angle, distance){
  // trigonometric calculation of polar motion
  return new Point(start.x+distance*Math.cos(angle), start.y+distance*Math.sin(angle), 0);
}

function updatePos(source){
  // update motion for next frame based on current pos, speed, dir
  var pos = trig(source.pos, source.dir, source.speed);
  source.moveTo(pos);
}

function distance(src1, src2){
  // simple distance between two points
  return Math.sqrt( Math.pow((src1.x-src2.x),2) + Math.pow((src1.y-src2.y),2) + Math.pow((src1.z-src2.z),2) );
}

//***********************************
// Events
//***********************************

function onSourceListenerCollision(source){
  var evt = $.Event('sourceListenerCollision');
  evt.source = source;

  $(window).trigger(evt);
}

function onRedraw(){
  var evt = $.Event('redraw');

  $(window).trigger(evt);
}

function onLaserOutOfBounds(source){
  var evt = $.Event('laserOutOfBounds');
  evt.source = source;

  $(window).trigger(evt);
}

function onSourceCollision(src1, src2){
  var evt = $.Event('sourceCollision');
  evt.src1 = src1;
  evt.src2 = src2;

  $(window).trigger(evt);
}

function onViewSource(src){
  var evt = $.Event('viewSource');
  evt.source = src;

  $(window).trigger(evt);
}

function onRotateListener(rotation){
  var evt = $.Event('rotateListener');
  evt.rotation = rotation;

  $(window).trigger(evt);
}
