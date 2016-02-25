float r = 0.0;

void setup() { 
  size(window.innerWidth, window.innerHeight, OPENGL);
  frameRate(40);

  stroke(255);
  noFill();
} 
 
void draw()  { 
  background(0);
  
  pushMatrix(); 
  translate(width/2, height/2, 200); 
  
  scale(90);

  rotateY(r);
  rotateX(r);
  cube();

  rotateY(-r);
  rotateX(r);
  cube();

  rotateY(r);
  rotateX(-r);
  cube();

  r = r + 0.01;
  popMatrix(); 
} 

function cube() {
  beginShape(QUADS);

  vertex(-1,  1,  1);
  vertex( 1,  1,  1);
  vertex( 1, -1,  1);
  vertex(-1, -1,  1);

  vertex( 1,  1,  1);
  vertex( 1,  1, -1);
  vertex( 1, -1, -1);
  vertex( 1, -1,  1);

  vertex( 1,  1, -1);
  vertex(-1,  1, -1);
  vertex(-1, -1, -1);
  vertex( 1, -1, -1);

  vertex(-1,  1, -1);
  vertex(-1,  1,  1);
  vertex(-1, -1,  1);
  vertex(-1, -1, -1);

  vertex(-1,  1, -1);
  vertex( 1,  1, -1);
  vertex( 1,  1,  1);
  vertex(-1,  1,  1);

  vertex(-1, -1, -1);
  vertex( 1, -1, -1);
  vertex( 1, -1,  1);
  vertex(-1, -1,  1);


  endShape();
}