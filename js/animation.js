var AIM_SENSITIVITY = 2

function update(){
  // Coordinate model updates and frame changes
  if(game.status == GAME_OVER){
    return;
  }
  requestAnimationFrame(update);

  // CHeck pressed keys
  // w-87, a-65, s-83, d-68
  if(keys[39]){ // right arrow
    listener.rotate(AIM_SENSITIVITY*(Math.PI/256));
    onRotateListener(AIM_SENSITIVITY*(Math.PI/256));
  }
  if(keys[37]){ // left arrow
    listener.rotate(AIM_SENSITIVITY*(-1*Math.PI/256));
    onRotateListener(AIM_SENSITIVITY*(-1*Math.PI/256));
  }

  // Update positions based on current position, speed, direction
  for(i=0; i<sourceMap.sources.length; i++){
    updatePos(sourceMap.sources[i]);
  }

  // update canvas
  redraw();
}
