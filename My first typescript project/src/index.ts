
/// <reference path="calc.ts"/> 

// Types
type Point={x:number, y:number}

class Viewport{
  x=0; y=0; w=0; h=0;
  constructor(){
    this.x=2
    this.y=1
    this.h=8
    this.w=this.h*window.innerWidth/window.innerHeight
  }
  remap(x:number,min1:number,max1:number,min2:number,max2:number):number{
    return (x-min1)/(max1-min1)*(max2-min2)+min2
  }
  transformPoint(x:number=0,y:number=0):Point{
    return { x:this.transformX(x),y:this.transformY(y) }
  }
  transformX(x:number=0):number{
    return this.remap(x,this.x-this.w,this.x+this.w,0,canvas.width)
  }
  transformY(y:number=0):number{
    return this.remap(y,this.y-this.h,this.y+this.h,canvas.height,0)
  }
  revertX(x:number=0):number{
    return this.remap(x,0,canvas.width,this.x-this.w,this.x+this.w)
  }
  revertY(y:number=0):number{
    return this.remap(y,canvas.height,0,this.y-this.h,this.y+this.h)
  }
  pan(offset:Point):void{
    this.x+=offset.x*(2*this.w)/canvas.width
    this.y-=offset.y*(2*this.h)/canvas.height
  }
  zoom(offset:number):void{
    // mx,my are used to zoom in at the cursor
    var mx=this.revertX(mousePos.x)
    var my=this.revertY(mousePos.y)
    if(offset<0){
      var dx=(mx-this.x)*(1-1/1.3)
      this.x+=dx
      var dy=(my-this.y)*(1-1/1.3)
      this.y+=dy
      this.w/=1.3 // only scaling w,h leads to zooming about the origin
      this.h/=1.3
    }else{
      var dx=(mx-this.x)*(1-1.3)
      this.x+=dx
      var dy=(my-this.y)*(1-1.3)
      this.y+=dy
      this.w*=1.3
      this.h*=1.3
    }
  }
}

// Declare rendering objects
const canvas=document.querySelector<HTMLCanvasElement>("#canvas")!; // saves me some headache
const ctx=canvas.getContext("2d");
const view=new Viewport()
let mousePos={x:0,y:0}
let graphs={} as {[key:string]:Function}
let points={} as {[key:string]:Point}
let mouseMomentum={x:0,y:0}
let mouseButton=0
const graphColors=[
  "#222", // Default Gray
  "#3498db", // Bright Blue
  "#2ecc71", // Emerald Green
  "#f39c12", // Sunflower Yellow
  "#e74c3c", // Crimson Red
  "#9b59b6", // Amethyst Purple
  "#27ae60", // Nephritis Green
  "#e67e22", // Carrot Orange
  "#e84393", // Wild Watermelon Pink
  "#2980b9", // Dark Blue
  "#d35400"  // Pumpkin Orange
]

// Setup rendering
if(!ctx || !canvas) console.log("Error getting canvas")
else{
  GraphViewRender(canvas,ctx)
  canvas.addEventListener("mousedown",(e)=>{
    //what to do hmmm
  })
  canvas.addEventListener("mousemove",(e)=>{
    var newMousePos={x:e.x,y:e.y}
    var mouseMoveDelta=PointOffset(mousePos,newMousePos)
    mouseButton=e.buttons
    if(e.buttons==1){
      view.pan(mouseMoveDelta)
      GraphViewRender(canvas,ctx)
      mouseMomentum.x=mouseMoveDelta.x*0.2+mouseMomentum.x*0.8
      mouseMomentum.y=mouseMoveDelta.y*0.2+mouseMomentum.y*0.8
    }
    mousePos=newMousePos
  })
  canvas.addEventListener('wheel',(e)=>{
    view.zoom(e.deltaY)
    GraphViewRender(canvas,ctx)
    return false; 
}, false);
}
setInterval(()=>{
  GraphViewRender(canvas,ctx!)
  if(mouseButton!=1) view.pan(mouseMomentum)
  mouseMomentum.x*=0.9
  mouseMomentum.y*=0.9
},0.1)

// Draw graphs on the canvas
function GraphViewRender(canvas:HTMLCanvasElement, ctx:CanvasRenderingContext2D){
  clearCanvas()

  // TODO: Axes overlap >:(

  function Round2(x:number){
    if(Math.abs(x)<1) return x.toFixed(2);
    return x.toString()
  }

  // X-axis
  ctx.fillStyle="#777"
  ctx.strokeStyle="#bbb"
  ctx.beginPath()
  var yT=clamp(view.transformY(),10,canvas.height-15)
  ctx.moveTo(0,yT) ; ctx.lineTo(canvas.width,yT)
  ctx.stroke()
  var notchInterval=getNotchInterval(view.x-view.w,view.x+view.w)
  getAxisNotches(view.x-view.w,view.x+view.w,notchInterval).forEach((x)=>{
    ctx.beginPath()
    xT=view.transformX(x)
    ctx.strokeStyle="#bbb"
    ctx.moveTo(xT,yT-5) ; ctx.lineTo(xT,yT+5)
    ctx.stroke()
    ctx.strokeStyle="#eee"
    ctx.moveTo(xT,0) ; ctx.lineTo(xT,canvas.height)
    if(x!=0)ctx.stroke()
    ctx.fillText(Round2(x),xT+3,yT+12)
  })
  
  // Y-axis
  ctx.strokeStyle="#bbb"
  ctx.beginPath()
  var xT=clamp(view.transformX(),360,canvas.width-10)
  ctx.moveTo(xT,0) ; ctx.lineTo(xT,canvas.width)
  ctx.stroke()
  getAxisNotches(view.y-view.h,view.y+view.h,notchInterval).forEach((y)=>{
    ctx.beginPath()
    yT=view.transformY(y)
    ctx.strokeStyle="#bbb"
    ctx.moveTo(xT-5,yT) ; ctx.lineTo(xT+5,yT)
    ctx.stroke()
    ctx.strokeStyle="#eee"
    ctx.moveTo(0,yT) ; ctx.lineTo(canvas.width,yT)
    if(y!=0)ctx.stroke()
    ctx.fillText(Round2(y),xT+10,yT+5)
  })

  // Graphs
  ctx.font="16px Arial"
  var graphIdx=0
  for(var g in graphs){
    ctx.fillStyle=graphColors[graphIdx%graphColors.length]
    ctx.fillText(g+"(x)",360,18+graphIdx*22)
    var pointOnGraph=view.transformPoint(view.x,graphs[g](view.x))
    ctx.moveTo(pointOnGraph.x,pointOnGraph.y)
    ctx.beginPath()
    for(var x=view.x-view.w; x<view.x+view.w+0.1; x+=0.1){ //+0.1 to render even when partially off-cam
      pointOnGraph=view.transformPoint(x,graphs[g](x))
      ctx.lineTo(pointOnGraph.x,pointOnGraph.y)
    }
    ctx.strokeStyle=graphColors[graphIdx%graphColors.length]
    ctx.stroke()
    graphIdx++
  }
}

// Helper functions
function PointOffset(a:Point,b:Point):Point{
  return {x:a.x-b.x,y:a.y-b.y}
}
function clearCanvas(){
  ctx!.fillStyle="white"
  ctx!.fillRect(0,0,canvas!.width,canvas!.height)
}
function clamp(x:number,min:number,max:number){
  if(x<min)return min
  if(x>max)return max
  return x
}
function getNotchInterval(from:number,to:number,nNotchesOptimal:number=40){
  var range=Math.abs(to-from)
  var optimalNotchDistance=100*range/nNotchesOptimal
  var notchDistance=0.01
  function iterFindNotch(){
    if(optimalNotchDistance<1) return true
    if(optimalNotchDistance<2){
      notchDistance*=2
      return true
    }
    if(optimalNotchDistance<5){
      notchDistance*=5
      return true
    }
    optimalNotchDistance/=10
    notchDistance*=10
    return false
  }
  for(var i=0; i<6; i++)if(iterFindNotch())return notchDistance
  return 100000
}
function getAxisNotches(from:number,to:number,notchDistance:number){
  var x=Math.min(to,from)
  x=Math.floor(x/notchDistance)*notchDistance
  var end=Math.max(to,from)
  var notches=[]
  for(;x<end; x+=notchDistance)
    if(x!=0)notches.push(x)
  return notches
}