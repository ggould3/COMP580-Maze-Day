function soundFile(string){
  // translate names into audio files
  var filename = "";
  if(string == "asteroid"){
    filename = asteroidSound ? asteroidSound : "sound/alien-siren.mp3";
  }else if(string == "laser"){
    filename = laserSound ? laserSound : "sound/laser-blasts.mp3";
  }else if(string == "destroy-asteroid"){
    filename = explosionSound ? explosionSound : "sound/barrel-exploding.mp3";
  }else if(string == "lock-on"){
    filename = lockonSound ? lockonSound : "sound/tone.mp3";
  }else{
    //no file with that alias
  }
  return filename;
}

function Node(point, file, volume, loop){
  this.default = "sound/alien-siren.mp3";
  var vol = volume ? volume : 0.5;
  var lp = loop ? loop : false;

  //adjust volume for sound files
  if(file == "sound/alien-siren.mp3"){
    vol = 0.5;
    lp = true;
  }else if(file == "sound/laser-blasts.mp3"){
    vol = 0.1;
  }

  if(file == null){
    this.sound = new Howl({
      src: [this.default]
    });
  }else{
    this.sound = new Howl({
      src: [file],
      format: ['mp3'],
      volume: vol,
      loop: lp
    });
  }

  this.id = null;
  this.pos = point;
  this.soundPos = null;

  this.play = function(){
    this.id = this.sound.play();
    this.updateSoundPos();
  }

  this.stop = function(){
    this.sound.stop();
  }

  this.move = function(x,y,y){
    this.pos.x += x;
    this.pos.y += y;
    this.pos.z += z;
    this.updateSoundPos();
  }

  this.moveTo = function(newPos){
    this.pos = newPos;
    this.updateSoundPos();
  }

  this.updateSoundPos = function(){
    // modify position scaling to clarify sounds relative to listener
    var maxSoundDist = 20;
    var baseDir = 3*Math.PI/2;
    var spawnRadius = distance(listener.pos, new Point(0,0,0));
    var d = distance(listener.pos, this.pos);
    var distFactor = d/spawnRadius;
    var soundDist = maxSoundDist * distFactor;
    // atan2 returns angle between point and positive x-axis
    var theta = Math.atan2(this.pos.y-listener.pos.y, this.pos.x-listener.pos.x);
    var relativeDir = baseDir-listener.dir+theta;
    var calcPoint = trig(new Point(0,0,0), relativeDir+Math.PI/2, soundDist);
    var soundPos = new Point(calcPoint.y, calcPoint.x);

    this.sound.pos(soundPos.x,soundPos.y,-0.5, this.id);
    this.soundPos = new Point(soundPos.x, soundPos.y, -0.5);
  }
}

function NodeMap(){
  this.nodes = new Array();

  this.add = function(node){
    this.nodes.push(node);
  }

  this.stopAll = function(){
    for(i=0; i<this.nodes.length; i++){
      this.nodes[i].stop();
    }
  }
}

function play3dSound(point, file, vol, lp){
  // for sounds not bound to a listener
  if(vol == null){
    vol = 0.5
  }
  if(lp == null){
    lp = false;
  }
  this.sound = new Howl({
    src: [file],
    format: ['mp3'],
    volume: vol,
    loop: lp,
    autoplay: true
  });

  this.id = null;
  this.pos = point;
  this.soundPos = null;

  this.play = function(){
    this.id = this.sound.play();
    this.sound.pos(this.pos.x, this.pos.y, -0.5, this.id);
  }

  this.stop = function(){
    this.sound.stop();
  }
}
