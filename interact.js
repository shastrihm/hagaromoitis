




var start_button = document.getElementById("startbutton");

var O_0 = {v:0};
var T_0 = {v:0};
var E_0 = {v:0};
var U_0 = {v:0};
var beta = {v:0};
var gamma = {v:0};
var delta = {v:0};
var epsilon = {v:0};
var alpha = {v:0};
var variables = [O_0, T_0, E_0, U_0, beta, gamma, delta, epsilon, alpha];

var MODEL = new Hagaromoitis(O_0.v, T_0.v, E_0.v, U_0.v, beta.v, gamma.v, delta.v, epsilon.v, alpha.v);

var STARTED = false;

function START_SIMULATION() {
  for(var i = 0; i < spans.length; i+= 1)
  {
    var span = spans[i];
    var val = span.innerHTML;
    if(val.includes("."))
    {
      variables[i].v = parseFloat(span.innerHTML);
    }
    else{
      variables[i].v = parseInt(span.innerHTML);
    }
  }

  MODEL = null;
  MODEL = new Hagaromoitis(O_0.v, T_0.v, E_0.v, U_0.v, beta.v, gamma.v, delta.v, epsilon.v, alpha.v);
  

  Plotly.newPlot('plot', [{
    y: [MODEL.O.length],
    mode: 'lines',
    name: 'O',
    line: {color: 'blue'}
  }, {
    y: [MODEL.T.length],
    mode: 'lines',
    name: 'T',
    line: {color: 'hotpink'}
  }, {
    y: [MODEL.E.length],
    mode: 'lines',
    name: 'E',
    line: {color: 'red'}
  }, {
    y: [MODEL.U.length],
    mode: 'lines',
    name: 'U',
    line: {color: 'green'}
  }]);


  function UPDATE() {
    ctx.clearRect(0,0,WIDTH, HEIGHT);
    MODEL.update();
  }

  function PLOTUPDATE() {
      Plotly.extendTraces('plot', {
      y: [[MODEL.O.length], [MODEL.T.length], [MODEL.E.length], [MODEL.U.length]]
    }, [0, 1, 2, 3])

  }
  if(STARTED){
    clearInterval(timer);
    clearInterval(plottimer);
  }

  var timer = setInterval(() => UPDATE(), 10);
  var plottimer = setInterval(() => PLOTUPDATE(), 1000);
  //plotting should be called much less often than the visualization for smoother performance

  STARTED = true;
}


start_button.onclick=START_SIMULATION;