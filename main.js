function end(value){
    if(value < 0.5){
        return -7;
    }else{
        return 0;
    }
}

class Neuron{
    constructor(numberOfInputs){
        this.length = numberOfInputs;
        this.weigth = [];

        for(let i=0;i<numberOfInputs;i++){
            let aux = Math.random();
            this.weigth.push(aux);
        }
    }

    ajust(erro, rate, lastInput){
        for(let i=0;i<this.length;i++){
            this.weigth[i] += (erro*rate*lastInput[i]);
        }
    }

   
    compute(inputs){
        let out=0;
        for(let i=0;i<this.length;i++){
            out += (this.weigth[i]*inputs[i]);
        }
        return out;
    }
}

class Layer{
    constructor(numberOfNeurons,numberOfInputs){
        this.lastInput = [];
        this.length = numberOfNeurons;
        this.neurons = []
        for (let i = 0; i < numberOfNeurons; i++) {
            this.neurons.push(new Neuron(numberOfInputs));            
        }
    }

    ajust(erro, rate){
        for (let i = 0; i < this.length; i++) {
            this.neurons[i].ajust(erro,rate,this.lastInput);            
        }
    }

    compute(inputs){
        this.lastInput = inputs;
        let out = [];
        for (let i = 0; i < this.length; i++) {
            out.push(this.neurons[i].compute(inputs));            
        }
        return out;
    }
}

class Network{
    constructor(numberOfInputs, modelLayers){
        this.length = modelLayers.length;
        this.layers = [];

        this.first = new Layer(modelLayers[0],numberOfInputs);
        this.layers.push(this.first);
        for (let i = 1; i < modelLayers.length; i++) {
            this.layers.push(new Layer(modelLayers[i],modelLayers[i-1]));
        }       
    }

    ajust(erro, rate){
        for(let i=0;i<this.length;i++){
            this.layers[i].ajust(erro, rate);
        }
    }

    compute(inputs){
        let out = inputs;
        for (let i = 0; i < this.length; i++) {
            out = this.layers[i].compute(out);
        }
        return out;
    }
}

/////////////////////////////////////////////////////////////////////////////

var canvas = document.getElementById("screen");
var context = canvas.getContext("2d");

const SIZEX = 400;
const SIZEY = 150;


// limpa a tela
function clear(){
    context.beginPath();
    context.rect(0,0,SIZEX,SIZEY);
    context.fillStyle = "turquoise";
    context.fill();
    context.closePath();
}


var player = {
    x: 50,
    y: 10,
    size: 5,

    draw: function(){
        context.beginPath();
        context.arc(this.x,this.y,this.size,0,Math.PI*2);
        context.fillStyle="#000";
        context.fill();
        context.closePath();
    },

    move: function(x,y){
        if(x+this.x+this.size > SIZEX){
            return false;
        }
        if(x+this.x < 0){
            return false;        
        }

        if(y+this.y-this.size < 0){
            return false;
        }
        
        if(y+this.y+this.size > SIZEY){
            return false;
        }
                
        this.x += x;
        this.y += y;
        return true;
    }
};


var pipes = {
    topy : 0,
    bottony : SIZEY,
    positionx : 300,
    w : 40,
    h : SIZEY/2,
    space: 50,
    score: 0,
    draw: function(){
        context.beginPath()
        context.rect(this.positionx,this.topy,this.w,this.h);
        context.fillStyle = "#333";
        context.fill();
        context.closePath();

        context.beginPath()
        context.rect(this.positionx,(this.h+this.space),this.w,SIZEY);
        context.fillStyle = "#333";
        context.fill();
        context.closePath();
    },
    reload:function(){
        if(this.positionx == 0){
            this.h = Math.random();
            this.h *= 100;
            this.h = parseInt(this.h);

            this.positionx = 300;
            this.score++;
        }else{
            this.positionx -= 1;
        }
    },
    playerColision: function(){
        if(player.x > this.positionx && player.x < (this.positionx+this.w)){
            if((player.y-player.size) < this.h ||

             (player.y+player.size) > (this.h+this.space)){
                return true;
            }
        }
        return false;
    }
};

// faz o controle da quantidade de espacos apertados pelo player
var moves = 1;
var spacePressed = 0;
window.addEventListener('keydown',function(event){
    if(event.keyCode == 32){
        spacePressed -= 7;
    }
});

var status = true; // verifica a colisao
var turn = 0; // timer para execultar o que a rede neural aprendeu
var playing = false;
var firstPlaying = true;

function moveNet(inputs){
    if(turn%6 == 0){
        let out = net.compute(inputs);
        out = out[0];
        spacePressed += end(out);
        turn = 0;
    }
    turn++;
}
function frame(){
    
    //faz os saltos do player
    if(spacePressed == 0){
        status = player.move(0,moves);
    }else{
        status = player.move(0,spacePressed++);
    }


    //verifica colisao
    if(status == "false" || pipes.playerColision()){
        spacePressed = 0;
        alert("colisao");
        pipes.positionx = 0;
        pipes.reload();
        player.x = 50;
        player.y = 10;
        pipes.score = 0;
    }


    // desenha os itens na tela
    {
        clear();
        player.draw();
        pipes.reload();
        pipes.draw();
    }

    // A rede neural aprende usando a distancia ate o cano
    // e a altura do cano de baixo
    let pipeUp = pipes.h - player.y;
    let pipeDown = (pipes.h+pipes.space) - player.y;
    let inputs = [pipeUp, pipeDown];


    if(pipes.score == 5){
        playing = true;
        if(firstPlaying){
            pipes.score = 0;
            firstPlaying = false;
        }
    }
    
    if(!playing){
        // aprende
        for(let i=0;i<100;i++){
            let out = net.compute(inputs);
            out = end(out[0]);
            // out = out[0];
            let key = (spacePressed<0)?-7:0;
            // let key = spacePressed;

            let erro = key-out;
            net.ajust(erro,0.0001);
        }
    }else{
        // execulta
        moveNet(inputs);
    }


    document.getElementById("score").innerText = (pipes.score).toString();
    setTimeout(frame,10);
}

var net = new Network(2,[1,5,10,5,1]);

frame();