//Asteroids Variables
var runningLockOn = false;
var lockOnTimer;
var stars = [];

function Asteroid(radians, speed){
  // Pixels / frame
  if(speed == null){
    this.speed = 0.4;
  }else{
    this.speed = speed;
  }
  //reverse angle to move to center;
  this.dir = radians + Math.PI;
  var spawnRadius = distance(ORIGIN, new Point(0,0,0));
  var pos = trig(ORIGIN, radians, spawnRadius);
  var sound = "asteroid";
  this.source = new Source(pos, sound, ASTEROID);
  this.source.speed = this.speed;
  this.source.dir = this.dir;
  this.source.play();

  // give source refernce to wrapper
  this.source.gamepiece = this;

  this.destroy = function(){
    if(game.status == ACTIVE){
      game.score += (1+(game.difficulty-1)*2);
      game.hits += 1;
      $('#score_num').text( game.score );
    }
    game.continue();
  }
}

function Laser(){
  // Pixels / frame
  this.speed = 5;
  this.dir = listener.dir;
  var pos = listener.pos;
  var sound = "laser";
  this.source = new Source(pos, sound, LASER);
  this.source.speed = this.speed;
  this.source.dir = this.dir;
  this.source.play();

  // give source reference to wrapper
  this.source.gamepiece = this;

  this.destroy = function(){
    // nothing to do
  }
}

function destroyEffects(point, type){
  // called when source destroyed
  if(type == ASTEROID){
    var explosion = new play3dSound(point, soundFile("destroy-asteroid"), 0.05, false);
    explosion.play();
  }
}

function asteroidReferee(){
  // monitors events and collisions
  game.status = ACTIVE;
  var _this = this;

  $(window).on('redraw', function (e) {
    _this.checkPositions();
  });

  $(window).on('sourceListenerCollision', function (e) {
    game.end();
    e.source.destroy();
  });

  $(window).on('laserOutOfBounds', function (e) {
    e.source.destroy();
  });

  $(window).on('sourceCollision', function (e) {
    e.src1.destroy();
    e.src2.destroy();
  });

  $(window).on('viewSource', function (e) {
    if(!runningLockOn){
      runLockOn(e.source);
    }
  });

  $(window).on('rotateListener', function (e) {
    clearLockOn();
  });

  this.checkPositions = function(){
    // Buffer is the proximity required to cause a hit in pixels
    var ASTEROID_BUFFER = 20;
    var sources = sourceMap.sources;
    var listenerPos = listener.pos;

    for(i=0; i<sources.length; i++){
      if(sources[i].type == ASTEROID){
        // Check for source in view
        var sourceDir = (sources[i].dir + Math.PI) % (Math.PI*2);
        var listDir = listener.dir % (Math.PI*2);
        if(Math.abs(listDir - sourceDir) < Math.PI/48){
          onViewSource(sources[i]);
        }
        // Check for asteroid-listener collisions
        if (Math.abs(sources[i].pos.x - listenerPos.x) < ASTEROID_BUFFER
                  && Math.abs(sources[i].pos.y - listenerPos.y) < ASTEROID_BUFFER
                  && Math.abs(sources[i].pos.z - listenerPos.z) < ASTEROID_BUFFER)
        {
          onSourceListenerCollision(sources[i]);
        }
      }
      // Check for laser-boundary collisions
      else if(sources[i].type == LASER){
        if(distance(sources[i].pos, listener.pos) > distance(listener.pos, new Point(0,0,0)))
        {
          onLaserOutOfBounds(sources[i]);
        }
      }
    }
    sources = sourceMap.sources;
    // Check for laser-asteroid collisions
    for(i=0; i<sources.length; i++){
      for(j=0; j<sources.length; j++){
        if(sources[j] != sources[i]
                  && Math.abs(sources[j].pos.x - sources[i].pos.x) < ASTEROID_BUFFER
                  && Math.abs(sources[j].pos.y - sources[i].pos.y) < ASTEROID_BUFFER
                  && Math.abs(sources[j].pos.z - sources[i].pos.z) < ASTEROID_BUFFER)
        {
          onSourceCollision(sources[i], sources[j]);
        }
      }
    }
  }
}

function spawnAsteroid(){
  // 1-> /4, 2-> /2, 3-> /1
  this.speed = Math.random()/(Math.pow(2,(3-game.difficulty)));
  // Minimum speed
  if(this.speed < 0.15){
    this.speed = 0.15
  }
  // Increase speed over time
  this.speed += (parseInt(game.hits/3)*game.difficulty)*(0.05);
  this.dir = Math.random()*2*Math.PI;
  // Modified dir to compensate for limited shooting angles
  this.dir = Math.round(this.dir/(Math.PI/64))*(Math.PI/64);
  var ast = new Asteroid(this.dir, this.speed);
}

function playAsteroids(){
  // 1 -> 4s, 2 -> 2s, 3->0s
  this.timeout = Math.random()*2000+(4-(game.difficulty-1)*2);
  //reduce delay over time
  this.timeout -= (parseInt(game.hits/3)*game.difficulty)*(100);
  // minimum wait
  if(this.timeout < 200){
    this.timeout = 200;
  }
  setTimeout(function(){ spawnAsteroid(); }, this.timeout);
}

function runLockOn(source){
  // lock on itterupted by movement after triggering event
  runningLockOn = true;
  var buffer = 500 // ms
  lockOnTimer = setTimeout(verifyLockOn, buffer);
}

function verifyLockOn(){
  // no movement since event
  if(runningLockOn == true){
    var lock = new play3dSound(listener.pos, soundFile("lock-on"), 0.1, false);
    lock.play();
  }
}

function clearLockOn(){
  // movement after lock on event
  clearTimeout(lockOnTimer);
  runningLockOn = false;
}

function generateStars(){
  // background of detailed view
  var num = 100;
  var star = 6000;

  for(i=0; i<num; i++){
    coordX = Math.random() * canvas.width;
    coordY = Math.random() * canvas.height;
    stars.push({x:coordX,y:coordY});
  }
}
