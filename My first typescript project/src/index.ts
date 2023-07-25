
/// <reference path="calc.ts"/> 

// <3
function remap(x:number,min1:number,max1:number,min2:number,max2:number):number{
  return (x-min1)/(max1-min1)*(max2-min2)+min2
}

// Defining the viewport
class Viewport{
  x=0; y=0; w=0; h=0;
  constructor(){
    this.x=0
    this.y=1
    this.h=8
    this.w=this.h*window.innerWidth/window.innerHeight
  }
  transformRect(r:Rect){
    return new Rect(this.transformX(r.x),this.transformY(r.y),r.w*this.dx,-r.h*this.dy)
  }

  get dx(){ return canvas.width/this.w*0.5 } // can be confusing so here you go ;)
  get dy(){ return canvas.height/this.h*0.5 }

  transformX(x:number=0,linear:boolean=true,linearOffset:number=0):number{
    return remap(x,this.x-this.w,this.x+this.w,0,canvas.width)
  }
  transformY(y:number=0,linear:boolean=true,linearOffset:number=0):number{
    return remap(y,this.y-this.h,this.y+this.h,canvas.height,0)
  }
  revertRect(r:Rect){
    return new Rect(this.revertX(r.x),this.revertY(r.y),r.w/this.dx,-r.h/this.dy)
  }
  revertX(x:number=0,linear:boolean=true):number{
    return remap(x,0,canvas.width,this.x-this.w,this.x+this.w)
  }
  revertY(y:number=0,linear:boolean=true):number{
    return remap(y,canvas.height,0,this.y-this.h,this.y+this.h)
  }
  pan(dx:number,dy:number):void{
    this.x+=dx/this.dx
    this.y-=dy/this.dy
  }
  zoom(offset:number):void{
    // mx,my are used to zoom in at the cursor
    var mx=this.revertX(mouse.x,true)
    var my=this.revertY(mouse.y,true)
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
class ViewportNonlinear extends Viewport{
  funcX:Function ; funcY:Function ; inverseX:Function ; inverseY:Function
  constructor(
  funcX:Function=(x:number)=>Math.log(x),
  funcY:Function=(y:number)=>y,
  inverseX:Function=(x:number)=>Math.pow(10,x),
  inverseY:Function=(y:number)=>y){
    super()
    this.funcX=funcX
    this.funcY=funcY
    this.inverseX=inverseX
    this.inverseY=inverseY
  }
  transformX(x:number=0,linear:boolean=false,linearOffset:number=0):number{
    return remap(linear?x:this.funcX(x)+linearOffset,this.x-this.w,this.x+this.w,0,canvas.width)
  }
  transformY(y:number=0,linear:boolean=false):number{
    return remap(linear?y:this.funcY(y),this.y-this.h,this.y+this.h,canvas.height,0)
  }
  revertX(x:number=0,linear:boolean=false):number{
    x=remap(x,0,canvas.width,this.x-this.w,this.x+this.w)
    return linear?x:this.inverseX(x)
  }
  revertY(y:number=0,linear:boolean=false):number{
    y=remap(y,canvas.height,0,this.y-this.h,this.y+this.h)
    return linear?y:this.inverseY(y)
  }
}
const canvas=document.querySelector<HTMLCanvasElement>("#canvas")!; // saves me some headache
const ctx=canvas.getContext("2d")!;
var view=new Viewport()

// Setting up the environment variables
const mouse={
  x:0,y:0,
  momentumX:0,momentumY:0,
  button:0,
  moved:0,
  selectionRect:{x:0,y:0,w:0,h:0} as Rect,
  displaySelectionRect:false
}
const renderables:Renderable[]=[]
let legendY=0
let legendX=0
const keys={"Shift":false,"Control":false} as {[key:string]:boolean}
let tempRenderable:Renderable|null=null
var selection:any[]=[]
var selectedHtmlNode:HTMLElement|null=null
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
const preferredFunctionNames="fghklmnopqrstuv" // omitting certain symbols, like 'i'

// Important functions
function setSelection(objects:Renderable[]|Renderable|HTMLElement|null=null,override:boolean=true){
  if(override && objects==null){
    for(const r of selection)
      if(r.htmlNode) r.htmlNode.classList.remove("selected")
      else if(r instanceof HTMLElement) r.classList.remove("selected")
    selection.length=0
    consoleInput.value=""
    outputField.innerHTML=""
    selectedHtmlNode=null
    Render()
    return
  }
  if(Array.isArray(objects)){
    for(const o of objects) selection.push(o)
    if(objects.length==0){
      consoleInput.value=""
      outputField.innerHTML=""
    }else if(objects.length==1){
      if(objects[objects.length-1].htmlNode && objects[objects.length-1].htmlNode!.hasAttribute("value"))
      consoleInput.value=objects[objects.length-1].htmlNode!.getAttribute("value")!
      consoleInput.focus()
    }
  }else{
    selection.push(objects)
    if(objects instanceof Renderable){
      if(objects.htmlNode && objects.htmlNode.hasAttribute("value"))
        consoleInput.value=objects.htmlNode.getAttribute("value")!
    }else{
      if(objects!.hasAttribute("value"))
        consoleInput.value=objects!.getAttribute("value")!
        objects!.classList.add("selected")
    }
    consoleInput.focus()
    outputField.innerHTML=""
  }
  for(const r of selection)
    if(r.htmlNode) r.htmlNode.classList.add("selected")
  if(selection.length>0){
    if(selection[selection.length-1] instanceof HTMLElement)
      selectedHtmlNode=selection[selection.length-1]
    else selectedHtmlNode=selection[selection.length-1].htmlNode
  }else selectedHtmlNode=null
  Render()
}
function getRenderable(name:string):Renderable|null{
  for(var i in renderables)
    if(renderables[i].name==name) return renderables[i]
  return null
}
function addRenderable(ro:Renderable):boolean{
  for(var i in renderables)
    if(renderables[i].name==ro.name){
      renderables[i]=ro
      return true
    }
  renderables.push(ro)
  return false
}
function sortRenderableObjects(){
  const renderableOrder = ['Matrix', 'Distribution','Graph', 'Vector', 'Point'];
  function customRenderableSort(a: Renderable, b: Renderable): number {
      const typeA = a.constructor.name;
      const typeB = b.constructor.name;
      return renderableOrder.indexOf(typeA) - renderableOrder.indexOf(typeB);
  }
  renderables.sort(customRenderableSort);
}

// Setting up listeners
document.addEventListener("keydown",(e)=>{
  if(Object.keys(keys).includes(e.key)) keys[e.key]=true
  if(e.key=="Delete"){
    if(selection.length==0) return
    for(const i in selection)
      if(selection[i] instanceof Renderable)
        selection[i].Delete()
      else{
        var ro=getRenderable(selection[i].getAttribute("name"))
        if(ro) ro.Delete()
        else selection[i].remove()
      }
    setSelection()
    return
  }
  if(!keys.Control && !keys.Shift)
    consoleInput.focus() // input is probably meant for the console
})
canvas.addEventListener("keyup",(e)=>{
  if(Object.keys(keys).includes(e.key)) keys[e.key]=false
})
canvas.addEventListener("contextmenu",(e)=>e.preventDefault()) // no right click menu on canvas
canvas.addEventListener("mouseup",(e)=>{
  e.preventDefault()
  mouse.button=e.button
  
  if(mouse.moved<10)
  {
    if(mouse.displaySelectionRect) // select rectangle
    {
      var selRect=view.revertRect(mouse.selectionRect).bounds
      console.log(selRect)
      var inSelection=[]
      for(const r in renderables){
        if(selection.includes(renderables[r])) continue
        if(selRect.Intersects(renderables[r].bounds))
        inSelection.push(renderables[r])
      }
      setSelection(inSelection)
      mouse.displaySelectionRect=false
      e.preventDefault()
    }
    else if(mouse.button==0) // select closest object
    {
      var x=view.revertX(e.x)
      var y=view.revertY(e.y)

      var Dist=(x1:number,y1:number,x2:number,y2:number)=>(x1-x2)**2+(y1-y2)**2
      var minDist=200/view.dx**2 // do not select something if its super far away

      if(!keys.Shift) setSelection() // deselects all
      for(var r in renderables){
        var dist=0
        if(renderables[r] instanceof Vector2)
          dist=Dist(x,y,(renderables[r] as Vector2).x2,(renderables[r] as Vector2).y2)
        else dist=Dist(x,y,renderables[r].x,renderables[r].y)
        if(dist<minDist){
          minDist=dist
          setSelection(renderables[r],!keys.Shift)
        }
      }
    }
  }
  
  mouse.displaySelectionRect=false
  Render()
})

canvas.addEventListener("dblclick",(e)=>{ // create new point
  var abcIdx=0
  for(; abcIdx<alphabet.length; abcIdx++)
    if(getRenderable(alphabet[abcIdx])==null)break
  
  var x=Math.round(view.revertX(e.x)*10000)/10000
  var y=Math.round(view.revertY(e.y)*10000)/10000
  var htmlNode=appendLog(alphabet[abcIdx]+"=("+x+", "+y+")",null,"",alphabet[abcIdx])
  var newPoint=new Point(alphabet[abcIdx],htmlNode,x,y,graphColors[abcIdx%graphColors.length])
  renderables.push(newPoint)
  setSelection(newPoint)
})

canvas.addEventListener("mousemove",(e)=>{
  var mouseMoveX=mouse.x-e.x
  var mouseMoveY=mouse.y-e.y
  //mouse.button=e.buttons
  
  if(mouse.button==1) // panning the viewport
  { 
    canvas.style.cursor="grab"
    mouse.moved+=mouseMoveX**2+mouseMoveY**2
    // note that sum=0.9, since we the panning is called faster when the
    // viewport is drifting than when the user is dragging around.
    here:mouse.momentumX=mouseMoveX*0.1+mouse.momentumX*0.8
    here:mouse.momentumY=mouseMoveY*0.1+mouse.momentumY*0.8
    view.pan(mouseMoveX,mouseMoveY)
    Render()
  }
  else
  {
    canvas.style.cursor="default"
    mouse.moved=0
  }

  if(e.buttons==2){
    mouse.selectionRect.w=e.x-mouse.selectionRect.x
    mouse.selectionRect.h=e.y-mouse.selectionRect.y
    Render()
  }
  mouse.x=e.x ; mouse.y=e.y
})

canvas.addEventListener("mousedown",(e)=>{
  mouse.button=e.buttons
  if(mouse.button==2){
    mouse.selectionRect=new Rect(e.x,e.y,0,0)
    mouse.displaySelectionRect=true
  }
})

canvas.addEventListener('wheel',(e)=>{ // Zooming
  view.zoom(e.deltaY)
  Render()
  return false; // prevents scrolling on the website
}, false);

setInterval(()=>{ // Camera momentum
  if(Math.abs(mouse.momentumX)+Math.abs(mouse.momentumY)<0.00001)return
  if(mouse.button!=1) view.pan(mouse.momentumX,mouse.momentumY)
  mouse.momentumX*=0.95
  mouse.momentumY*=0.95
  Render()
},0.1)


// The juice
function Render(){
  clearCanvas()
  ctx.font="16px Arial"

  function Round2(x:number){
    if(Math.abs(x)<1) return x.toFixed(2);
    return x.toString()
  }

  //#region Render grid
  // X-axis
  ctx.lineWidth=1
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
  notchInterval=getNotchInterval(view.y-view.h,view.y+view.h,20)
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
  //#endregion

  legendY=25
  legendX=Math.max(45,calcWindow.clientWidth+10)
  if(calcWindow.clientWidth<15){
    legendY=240
    legendX=14
  }
  if(tempRenderable){
    if(tempRenderable.update) tempRenderable.update!()
    tempRenderable.Render(true)
  }
  for(const i in renderables)
  {
    if(renderables[i].update) renderables[i].update!()
    renderables[i].Render()
  }
    

  if(mouse.displaySelectionRect){
    ctx.fillStyle="rgba(255, 0, 0, 0.3)"
    ctx.fillRect( mouse.selectionRect.x,
                  mouse.selectionRect.y,
                  mouse.selectionRect.w,
                  mouse.selectionRect.h)
  }
  
  
}

// Helper functions
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

Render() // render first time :)