
/// <reference path="calc.ts"/> 

// Types
type Point={x:number, y:number,update:any}|null
type Vector={x:number, y:number,x0:number,y0:number,update:any}|null

class Matrix{
  cells:number[][]
  rows:number
  columns:number
  update:Function

  constructor(cells:number[][],rows:number,columns:number=1,update:any=false){
    this.cells=cells // [[a,b],[c,d]]
    this.rows=rows
    this.columns=columns
    this.update=update
  }
  get(row:number,column:number=0){
    return this.cells[row][column]
  }
  set(value:number,row:number,column:number=0){
    this.cells[row][column]=value
  }
  iter(f:Function){
    for(var i=0; i<this.rows; i++)
      for(var j=0; j<this.columns; j++)
        this.set(f(i,j),i,j)
  }
  max(){
    var maxVal=this.cells[0][0]
    for(var i=0; i<this.rows; i++)
      for(var j=0; j<this.columns; j++)
        maxVal=Math.max(maxVal,this.get(i,j))
    return maxVal
  }
  min(){
    var minVal=this.cells[0][0]
    for(var i=0; i<this.rows; i++)
      for(var j=0; j<this.columns; j++)
      minVal=Math.min(minVal,this.get(i,j))
    return minVal
  }
  column(j:number=0){
    var res=[]
    for(var i=0; i<this.rows; i++) res.push(this.get(i,j))
    return res
  }
  row(i:number=0){
    var res=[]
    for(var j=0; j<this.columns; j++) res.push(this.get(i,j))
    return res
  }
  rownorm(){
    for(var i=0; i<this.rows; i++){
      var row=this.row(i)
      var mean=0
      for(var j=0; j<row.length; j++) mean+=row[j]
      mean/=row.length
      var std=0
      for(var j=0; j<this.columns; j++) std+=(this.get(i,j)-mean)**2
      std=Math.sqrt(std/row.length)
      for(var j=0; j<this.columns; j++) this.set((this.get(i,j)-mean)/std,i,j)
    }
  }
  colnorm(){
    for(var i=0; i<this.columns; i++){
      var column=this.column(i)
      var mean=0
      for(var j=0; j<column.length; j++) mean+=column[j]
      mean/=column.length
      var std=0
      for(var j=0; j<this.rows; j++) std+=(this.get(j,i)-mean)**2
      std=Math.sqrt(std/column.length)
      for(var j=0; j<this.rows; j++) this.set((this.get(j,i)-mean)/std,j,i)
    }
  }
  transpose(){
    var res=[]
    for(var j=0; j<this.rows; j++){
      var row=[]
      for(var i=0; i<this.columns; i++){
        row.push(this.get(i,j))
      }
      res.push(row)
    }
    this.cells=res
    var temp=this.columns
    this.columns=this.rows
    this.rows=temp

  }
  mulVec(v:number[]){
    return this.mul(new Matrix([v],v.length)) // cast to column vector
  }
  mul(m:Matrix){
    throw("Not implemented yet")
  }
}

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
  dx(){
    return canvas.width/this.w*0.5
  }
  dy(){
    return canvas.height/this.h*0.5
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
let matrices={} as {[key:string]:Matrix}
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
    var x=Math.round(view.revertX(e.x)*10000)/10000
    var y=Math.round(view.revertY(e.y)*10000)/10000
    points[alphabet[abcIdx]]={x:x,y:y,update:false }
    print(alphabet[abcIdx]+"=("+x+", "+y+")",alphabet[abcIdx]+"=("+x+", "+y+")",true,"p"+alphabet[abcIdx])
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
  var yT=clamp(view.transformY(),5,canvas.height-23)
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
    ctx.fillText(Round2(x),xT-8,yT+18)
  })
  
  // Y-axis
  ctx.strokeStyle="#bbb"
  ctx.beginPath()
  var xT=clamp(view.transformX(),Math.max(50,calcWindow.clientWidth+8),canvas.width-8) //honestly i just like these numbers, no meaning behind them
  var drawNumbersOnRightSide=xT<100+calcWindow.clientWidth
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
    var yString=Round2(y)
    var stringWidth=ctx.measureText(yString).width
    ctx.fillText(yString,xT-10-stringWidth+(drawNumbersOnRightSide?+20+stringWidth:0),yT+5)
  })

  // Matrices
  graphIdx=0
  for(var m in matrices){
    if(!matrices[m])continue
    if(matrices[m]!.update)matrices[m]!.update()

    if(m=="_temporary_"){
      if(!includeTemporary) continue
      ctx.strokeStyle="#acc"
      graphIdx--
    }
    ctx.fillText(m,view.transformX(0),view.transformY(0))
    ctx.fillStyle="white"
    var x0=view.transformX(0)
    var y0=view.transformY(0)
    ctx.fillRect(x0,y0,view.transformX(matrices[m].columns)-x0-1,view.transformY(-matrices[m].rows)-y0-1)
    ctx.fillStyle=graphColors[graphIdx%graphColors.length]
    ctx.strokeStyle=graphColors[graphIdx%graphColors.length]

    var min=matrices[m].min()
    var max=matrices[m].max()
    var dx=view.dx()
    var dy=view.dy()
    for(var i=0; i<matrices[m].rows; i++){
      for(var j=0; j<matrices[m].columns; j++){
        
        ctx.fillStyle="hsl("+view.remap(matrices[m].get(i,j),min,max,230,0)+", 80%, 50%)"
        ctx.fillRect(view.transformX(j)-1,view.transformY(-i)-1,dx,dy)
        if(view.h>8)continue
        ctx.fillStyle=graphColors[0]
        ctx.fillText(matrices[m].get(i,j).toString(),view.transformX(j+0.5)-5,view.transformY(-i-0.5)+5)
      }
    }
    graphIdx++
  }

  // Graphs
  var graphIdx=0
  var textY=25
  var textX=Math.max(45,calcWindow.clientWidth+10)
  if(calcWindow.clientWidth<15){
    textY=240
    textX=14
  }
  for(var g in graphs){
    if(!graphs[g])continue
    if(g=="_temporary_"){
      if(includeTemporary){
        ctx.strokeStyle="#acc"
      }
      else continue
    }else{
      ctx.fillStyle=graphColors[graphIdx%graphColors.length]
      ctx.fillText(g+"(x)",textX,textY)
      textY+=25
      ctx.strokeStyle=graphColors[graphIdx%graphColors.length]
      graphIdx++
    }
    var pointOnGraph=view.transformPoint(view.x,graphs[g]!(view.x))!
    ctx.moveTo(pointOnGraph!.x,pointOnGraph!.y)
    ctx.beginPath()
    var inc=view.w*0.0004
    for(var x=view.x-view.w; x<view.x+view.w+inc; x+=inc){ //+1 inc to render even when partially off-cam
      pointOnGraph=view.transformPoint(x,graphs[g]!(x))!
      
      var render:boolean=(pointOnGraph.y<canvas.height && pointOnGraph.y>0)
      if(render)ctx.lineTo(pointOnGraph.x,pointOnGraph.y)
      // overshoot a little so lines coming onto the screen have the correct direction
      else ctx.moveTo(pointOnGraph.x,clamp(pointOnGraph.y,-100,canvas.height+100)) 
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
    var offsetY=Math.sign(endY-startY)*12+5
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