var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");

var WIDTH = canvas.width;
var HEIGHT = canvas.height;
var ODB_HEIGHT = 200; // y coordinate where ODB starts

//
var NUM_AGENTS = 1000;


// Agent specific globals
var SIZE_RADIUS = 8;
var MOVEMENT_RADIUS = 100;
var CONTACT_RADIUS = 5;



function loadInitial()
{
  window.onload = function()
    {

    }
}

function withinBounds(x,y){
    return x < WIDTH & y < HEIGHT & x > 0 & y > ODB_HEIGHT;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomUnif(min, max) {
    return Math.random() * (max - min) + min;
}

function randomExponential(rate) {
  // http://en.wikipedia.org/wiki/Exponential_distribution#Generating_exponential_variates
  if(rate <= 0){
    return Infinity; // exponentially distributed wait time is infinity when rate is 0
  }
  var U = Math.random();
  return -Math.log(U)/rate;
}

function randomPointInRadius(x,y,r) {

    var plusOrMinus_x = Math.random() < 0.5 ? -1 : 1;
    var plusOrMinus_y = Math.random() < 0.5 ? -1 : 1;
    var dx = getRandomInt(0, r)*plusOrMinus_x;
    var dy = getRandomInt(0, r)*plusOrMinus_y;
    while(!withinBounds(x+dx,y+dy))
    {
           plusOrMinus_x = Math.random() < 0.5 ? -1 : 1;
           plusOrMinus_y = Math.random() < 0.5 ? -1 : 1;
           dx = getRandomInt(0, r)*plusOrMinus_x;
           dy = getRandomInt(0, r)*plusOrMinus_y;
    }
    return [x+dx,y+dy];
          
}

function initAgents(n){
    var AGENTS = [];
    for(var i = 0; i < n; i += 1) {
      AGENTS.push(new Agent(getRandomInt(0,WIDTH), getRandomInt(ODB_HEIGHT,HEIGHT)));
    } 
    return AGENTS;
}

function Hagaromoitis(O_0, T_0, E_0, U_0, beta, gamma, delta, epsilon, alpha)
{
  this.N = O_0 + T_0 + E_0 + U_0;
  this.initial = {O: O_0, T: T_0, E:E_0, U:U_0};
  // multiply by 0.001 to go from per second to per 10ms (since we update every 10ms)
  this.params = {b: beta*0.001, g: gamma*0.001, d: delta*0.001, e: epsilon*0.001, a: alpha*0.001};

  
  this.contact_r = Math.sqrt(((this.params.b*WIDTH*(HEIGHT-ODB_HEIGHT))/(Math.PI)));


  // set up
  this.O = initAgents(this.initial.O);

  this.T = initAgents(this.initial.T);
  this.T.forEach(agent=>function(){
                            agent.wait.E = randomExponential(gamma*0.001);
                            agent.wait.U = randomExponential(delta*0.001)}());


  this.E = initAgents(this.initial.E,);
  this.E.forEach(agent=>function(){
                            agent.wait.U = randomExponential(epsilon*0.001)}());

  this.U = initAgents(this.initial.U);
  this.U.forEach(agent=>function(){
                            agent.wait.O = randomExponential(alpha*0.001)}());

  this.infect = function(){
      var that = this;
      var infectCheck = function(infected){
        var newly_infected = [];
        for(var i = 0; i < that.O.length; i+= 1)
        {
          var oblivious = that.O[i];
          var intersects = Math.hypot(infected.x - oblivious.x, infected.y - oblivious.y) <= (that.contact_r + oblivious.r);

          if(intersects){
            newly_infected.push(oblivious);
            that.O[i] = false; 
            oblivious.wait.U = randomExponential(that.params.d);
            oblivious.wait.E = randomExponential(that.params.g);
          }
        }
        that.O = that.O.filter(item => item != false); // remove empty elts from delete
        that.T = that.T.concat(newly_infected);
    }

    // infectious compartments 
    this.T.forEach(infectCheck);
    this.E.forEach(infectCheck);
    
  }

  this.update_wait_times = function(){
    // the compartments that have incoming transition rates not dependent on contact rate

    // wait times for T -> U or T->E are init in infect function, as that is where newly infected
    // agents are handled


      var that = this;
      var timestep = 10; // 10 ms

      var transferCheckto_O = function(agent){
        agent.wait.O -= timestep;
        if (agent.wait.O <= 0)
        {
          agent.wait = {O: Infinity, E:Infinity, U:Infinity};
          that.U.splice(that.U.indexOf(agent), 1);
          that.O.push(agent);

          // Don't need to initialize new wait time, since O -> T depends on contact rate
        }
      }

      var transferCheckto_E = function(agent){
        agent.wait.E -= timestep;
        if (agent.wait.E <= 0)
        {
          agent.wait = {O: Infinity, E:Infinity, U:Infinity};
          that.T.splice(that.T.indexOf(agent), 1);
          that.E.push(agent);

          agent.wait.U = randomExponential(that.params.e);
        }
      }

      var transferCheckto_U = function(agent){
        // from E
        agent.wait.U -= timestep;
        if (agent.wait.U <= 0)
        {
          agent.wait = {O: Infinity, E:Infinity, U:Infinity};
          that.E.splice(that.E.indexOf(agent), 1);
          that.U.push(agent);

          agent.wait.O = randomExponential(that.params.a);
        }
      }

      var transferCheckfrom_T = function(agent){
        agent.wait.U -= timestep;
        agent.wait.E -= timestep;
        
        if (agent.wait.U <= 0 & agent.wait.U <= agent.wait.E)
        {
  
          agent.wait = {O: Infinity, E:Infinity, U:Infinity};
          that.T.splice(that.T.indexOf(agent), 1);
          that.U.push(agent);

          agent.wait.O = randomExponential(that.params.a);
        }

        else if(agent.wait.E <= 0)
        {

          agent.wait = {O: Infinity, E:Infinity, U:Infinity};
          that.T.splice(that.T.indexOf(agent), 1);
          that.E.push(agent);

          agent.wait.U = randomExponential(that.params.e);
        }

      }

    this.T.forEach(agent=>transferCheckfrom_T(agent));
    this.E.forEach(agent=>transferCheckto_U(agent));
    this.U.forEach(agent=>transferCheckto_O(agent));


  }

  this.update_agents = function(){
      [this.O, this.T, this.E, this.U].forEach(arr=>arr.forEach(entity=>entity.update())); 
  }

  this.update = function(){
    this.infect();
    this.update_wait_times();
    this.O.forEach(agent=>agent.setColor("blue"));
    this.T.forEach(agent=>agent.setColor("hotpink"));
    this.E.forEach(agent=>agent.setColor("red"));
    this.U.forEach(agent=>agent.setColor("green"));
    this.update_agents();
    //console.log(this.O.length, this.T.length, this.E.length, this.U.length);
  }

  this.clear = function(){
    this.O = [];
    this.E = [];
    this.T = [];
    this.U = [];
  }
}


function Agent(x,y)
{ 

  this.x = x;
  this.y = y;
  this.r = SIZE_RADIUS;

  // wait times are in units of the timestep (10 ms)
  this.wait = {O: Infinity, E:Infinity, U:Infinity}; // exponentially distributed wait time

  this.move_r = MOVEMENT_RADIUS;

  var target = randomPointInRadius(this.x, this.y, this.move_r);
  this.current_target = {x: target[0], y: target[1]};
  this.slope = {dy: this.current_target.y - this.y, dx: this.current_target.x - this.x};


  this.updatePos = function(){

      if(Math.abs(this.current_target.x -this.x) <= 5 & Math.abs(this.current_target.y -this.y) <= 5)
      {
            
          var newpoint = randomPointInRadius(this.x, this.y, this.move_r);
          this.current_target.x = newpoint[0];
          this.current_target.y = newpoint[1];
          this.slope = {dy: this.current_target.y - this.y, dx: this.current_target.x - this.x};
      }
      var c = Math.random()/20;
      this.x = this.x + c*this.slope.dx;
      this.y = this.y + c*this.slope.dy;
  }


  this.setColor = function(color){
    this.color = color;
  }

  this.draw = function(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.stroke();
  }

  this.update = function(){
    this.updatePos();
    this.draw();
  }
}

loadInitial();



///////////////////////////////////////////////

