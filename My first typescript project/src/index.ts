
/// <reference path="calc.ts"/> 

// Types
type Point={x:number, y:number,update:any}|null
type Vector={x:number, y:number,x0:number,y0:number,update:any}|null

class Viewport{
  x=0; y=0; w=0; h=0;
  constructor(){
    this.x=0
    this.y=1
    this.h=8
    this.w=this.h*window.innerWidth/window.innerHeight
  }
  remap(x:number,min1:number,max1:number,min2:number,max2:number):number{
    return (x-min1)/(max1-min1)*(max2-min2)+min2
  }
  transformPoint(x:number=0,y:number=0):Point{
    return { x:this.transformX(x),y:this.transformY(y),update:false }
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
    this.x+=offset!.x*(2*this.w)/canvas.width
    this.y-=offset!.y*(2*this.h)/canvas.height
  }
  zoom(offset:number):void{
    // mx,my are used to zoom in at the cursor
    var mx=this.revertX(mousePos.x)
    var my=this.revertY(mousePos.y)
    if(offset<0){
      var dx=(mx-this.x)*(1-1/1.1)
      this.x+=dx
      var dy=(my-this.y)*(1-1/1.1)
      this.y+=dy
      this.w/=1.1 // only scaling w,h leads to zooming about the origin
      this.h/=1.1
    }else{
      var dx=(mx-this.x)*(1-1.1)
      this.x+=dx
      var dy=(my-this.y)*(1-1.1)
      this.y+=dy
      this.w*=1.1
      this.h*=1.1
    }
  }
}

// Declare rendering objects
const canvas=document.querySelector<HTMLCanvasElement>("#canvas")!; // saves me some headache
const ctx=canvas.getContext("2d");
const view=new Viewport()
let mousePos={x:0,y:0,update:false }
let graphs={} as {[key:string]:Function|null}
let points={} as {[key:string]:Point}
let vectors={'_temporary_':{x:0,y:0,x0:0,y0:0,update:false }} as {[key:string]:Vector}
let mouseMomentum={x:0,y:0,update:false }
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
const alphabet="abcdefghijklmnopqrstuvwxyz"

// Setup rendering
if(!ctx || !canvas) console.log("Error getting canvas")
else{
  GraphViewRender(canvas,ctx)
  canvas.addEventListener("dblclick",(e)=>{
    var abcIdx=0
    for(; abcIdx<alphabet.length; abcIdx++)
      if(!points[alphabet[abcIdx]])break
    var x=view.revertX(e.x)
    var y=view.revertY(e.y)
    points[alphabet[abcIdx]]={x:x,y:y,update:false }
    print(alphabet[abcIdx]+"=("+x+";"+y,alphabet[abcIdx]+"=("+x+";"+y,true,"p"+alphabet[abcIdx])
    GraphViewRender(canvas,ctx)
  })
  canvas.addEventListener("mousemove",(e)=>{
    var newMousePos={x:e.x,y:e.y,update:false }
    var mouseMoveDelta=PointOffset(mousePos,newMousePos)
    mouseButton=e.buttons
    if(e.buttons==1){
      view.pan(mouseMoveDelta)
      GraphViewRender(canvas,ctx)
      mouseMomentum.x=mouseMoveDelta!.x*0.2+mouseMomentum.x*0.8
      mouseMomentum.y=mouseMoveDelta!.y*0.2+mouseMomentum.y*0.8
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
  if(Math.abs(mouseMomentum.x)+Math.abs(mouseMomentum.x)<0.0001)return
  GraphViewRender(canvas,ctx!)
  if(mouseButton!=1) view.pan(mouseMomentum)
  mouseMomentum.x*=0.9
  mouseMomentum.y*=0.9
},0.1)

// Draw graphs on the canvas
function GraphViewRender(canvas:HTMLCanvasElement, ctx:CanvasRenderingContext2D,includeTemporary:boolean=false){
  clearCanvas()
  ctx.font="16px Arial"

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
  var xT=clamp(view.transformX(),calcWindow.clientWidth+10,canvas.width-10)
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
  var graphIdx=0
  for(var g in graphs){
    if(!graphs[g])continue
    if(g=="_temporary_"){
      if(includeTemporary){
        ctx.strokeStyle="#acc"
      }
      else continue
    }else{
      ctx.fillStyle=graphColors[graphIdx%graphColors.length]
      ctx.fillText(g+"(x)",calcWindow.clientWidth+10,18+graphIdx*22)
      ctx.strokeStyle=graphColors[graphIdx%graphColors.length]
      graphIdx++
    }
    var pointOnGraph=view.transformPoint(view.x,graphs[g]!(view.x))
    ctx.moveTo(pointOnGraph!.x,pointOnGraph!.y)
    ctx.beginPath()
    var inc=view.w*0.0004
    for(var x=view.x-view.w; x<view.x+view.w+inc; x+=inc){ //+1 inc to render even when partially off-cam
      var pointOnGraph1=view.transformPoint(x,graphs[g]!(x))
      if(Math.abs(pointOnGraph1!.y-pointOnGraph!.y)>1000)
        ctx.moveTo(pointOnGraph1!.x,pointOnGraph1!.y)
      else ctx.lineTo(pointOnGraph1!.x,pointOnGraph1!.y)
      pointOnGraph=pointOnGraph1
    }
    
    ctx.stroke()
  }

  // Vectors
  graphIdx=0
  for(var v in vectors){
    if(!vectors[v])continue
    if(vectors[v]!.update)vectors[v]!.update()
    var endX=view.transformX(vectors[v]!.x)
    var endY=view.transformY(vectors[v]!.y)
    var startX=view.transformX(vectors[v]!.x0)
    var startY=view.transformY(vectors[v]!.y0)
    var offsetY=sign(endY-startY)*12+5
    if(v=="_temporary_"){
      if(!includeTemporary) continue
      ctx.strokeStyle="#acc"
      graphIdx--
    }else{
      ctx.fillStyle=graphColors[graphIdx%graphColors.length]
      ctx.strokeStyle=graphColors[graphIdx%graphColors.length]
      ctx.fillText(v,endX,endY+offsetY)
    }
    ctx.beginPath()
    ctx.moveTo(startX,startY)
    ctx.lineTo(endX,endY)
    var magnitude=Math.sqrt((vectors[v]!.x-vectors[v]!.x0)**2+(vectors[v]!.y-vectors[v]!.y0)**2)
    var normX=(vectors[v]!.x-vectors[v]!.x0)/magnitude
    var normY=(vectors[v]!.y-vectors[v]!.y0)/magnitude
    var arrowHeadSize=Math.min(magnitude*0.1,0.2)
    ctx.lineTo(view.transformX(vectors[v]!.x+(normY-normX)*arrowHeadSize),view.transformY(vectors[v]!.y-(normX+normY)*arrowHeadSize))
    ctx.moveTo(endX,endY)
    ctx.lineTo(view.transformX(vectors[v]!.x-(normY+normX)*arrowHeadSize),view.transformY(vectors[v]!.y+(normX-normY)*arrowHeadSize))
    ctx.stroke()
    graphIdx++
  }
  
  // Points
  graphIdx=0
  for(var p in points){
    if(!points[p])continue
    if(points[p]!.update)points[p]!.update()
    var x=view.transformX(points[p]!.x)
    var y=view.transformY(points[p]!.y)
    if(p=="_temporary_"){
      if(!includeTemporary) continue
      ctx.strokeStyle="#acc"
      graphIdx--
    }else{
      ctx.fillStyle=graphColors[graphIdx%graphColors.length]
      ctx.strokeStyle=graphColors[graphIdx%graphColors.length]
      ctx.fillText(p,x+8,y+5)
    }
    ctx.fillStyle = graphColors[graphIdx%graphColors.length];
    ctx.beginPath();
    ctx.arc(x,y, 6, 0, 2 * Math.PI);
    ctx.fill();
    graphIdx++
  }
}

// Helper functions
function PointOffset(a:Point,b:Point):Point{
  return {x:a!.x-b!.x,y:a!.y-b!.y,update:false }
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
function getNotchInterval(from:number,to:number,nNotchesOptimal:number=35){
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