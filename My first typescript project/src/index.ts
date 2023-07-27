
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
      this.w/=1.1 // only scaling w,h leads to zooming about the origin
      if(!keys.Shift){
        var dy=(my-this.y)*(1-1/1.1)
        this.y+=dy
        this.h/=1.1
      }else
      canvas.style.cursor="ew-resize"
    }else{
      var dx=(mx-this.x)*(1-1.1)
      this.x+=dx
      this.w*=1.1
      if(!keys.Shift){
        var dy=(my-this.y)*(1-1.1)
        this.y+=dy
        this.h*=1.1
      }else
      canvas.style.cursor="ew-resize"
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
  displaySelectionRect:false,
  clickTime:Date.now(),
}

const renderables:Renderable[]=[]
let legendY=0
let legendX=0
const keys={"Shift":false,"Control":false} as {[key:string]:boolean}
let tempRenderable:Renderable|null=null
var selection:any[]=[]
var selectedHtmlNode:HTMLElement|null=null
const graphColors=[
  //"#222", // Default Gray
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

// Important functions
function setSelection(objects:Renderable[]|Renderable|HTMLElement|null=null,override:boolean=true){
  if(override && objects==null){
    for(var r=0; r<selection.length; r++){
      if(selection[r]){
        if(selection[r].htmlNode) selection[r].htmlNode.classList.remove("selected")
        else if(selection[r] instanceof HTMLElement) selection[r].classList.remove("selected")
      }else selection.splice(r,1)
    }
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
    }else if(objects){
      if(objects!.hasAttribute("value"))
        consoleInput.value=objects!.getAttribute("value")!
        objects!.classList.add("selected")
    }
    consoleInput.focus()
    outputField.innerHTML=""
  }
  for(const r of selection)
    if(r && r.htmlNode) r.htmlNode.classList.add("selected")
  if(selection.length>0){
    if(selection[selection.length-1] instanceof HTMLElement)
      selectedHtmlNode=selection[selection.length-1]
    else if(selection[selection.length-1])selectedHtmlNode=selection[selection.length-1].htmlNode
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
  console.log(e.key)
  if(Object.keys(keys).includes(e.key)) keys[e.key]=true
  if(e.key=="o" && e.ctrlKey){ // open file
    document.querySelector<HTMLInputElement>("#file-upload")!.click()
    e.preventDefault()
  }
  if(e.key=="s" && e.ctrlKey){ // save to file
    downloadFile()
    e.preventDefault()
  }
  if(e.key=="a" && e.ctrlKey && document.activeElement!==consoleInput){ // (toggle) select all
    e.preventDefault()
    if(selection.length==renderables.length && (selection[0] instanceof(Renderable) || getRenderable(selection[0].getAttribute("name")) ))
    setSelection()
    else setSelection(renderables)
    canvas.focus()
  }
  if(e.key=="h" && e.ctrlKey){ // hide selection
    if(selection.length==0) return
    e.preventDefault()
    var display=!selection[0].display
    for(const i in selection)
      if(selection[i] instanceof Renderable){
        selection[i].display=display
        for(const v of selection[i].virtual)
          v.display=selection[i].display
      }
    Render()
  }
  if(e.key=="f" && e.ctrlKey){ //fitting with linreg or a selected model
    e.preventDefault()
    if(selection.length>0 && selection[0] instanceof(Renderable)){
      if(selection[0] instanceof(Graph)){ // use genetic algorithm fit
        var evalString="fit("
        for(const s of selection){
          if(s instanceof(HTMLElement))return
          evalString+=s.name+", "
        }
        setSelection()
        inputReceived(evalString)
      }else{ // use linreg
        var evalString="linreg("
        for(const s of selection){
          if(s instanceof(HTMLElement))return
          evalString+=s.name+", "
        }
        evalString=evalString.substring(0,evalString.length-2)+")"
        if(isValidEvalString(evalString)){
          setSelection()
          var name=firstFreeName(fgh)
          const g=new Graph(name,appendLog(name+"(x)",evalString,evalString,name),evalOutput as Function,graphColors[renderables.length%graphColors.length])
          addRenderable(g)
          Render()
        }
      }
    }
  }
  if(e.key=="Delete"){
    if(e.shiftKey){ // delete everything
      emptyLog()
      consoleInput.value=""
    }
    else // delete selection
    {
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
    consoleInput.focus()
  }
  if(!keys.Control && !keys.Shift)
    consoleInput.focus() // input is probably meant for the console
})
canvas.addEventListener("keyup",(e)=>{
  if(Object.keys(keys).includes(e.key)) keys[e.key]=false
})
canvas.addEventListener("contextmenu",(e)=>e.preventDefault()) // no right click menu on canvas
canvas.addEventListener("mouseup",(e)=>{
  if(defineVectorOrPoint && tempRenderable){
    tempRenderable.htmlNode=appendLog(tempRenderable.name+"="+tempRenderable.toString(),null,"",tempRenderable.name)
    addRenderable(tempRenderable)
    eval(tempRenderable.name+"=tempRenderable")
    setSelection(tempRenderable)
    defineVectorOrPoint=false
    tempRenderable=null
  }
  mouse.button=e.button
  
  if(mouse.moved<10)
  {
    var virtualRects=[]
    for(const r of renderables){
      if(!r || !r.display)continue
      virtualRects.push(r)
      for(const rr of r.virtual) if(rr.display) virtualRects.push(rr)
    }
    if(mouse.displaySelectionRect) // select rectangle
    {
      var selRect=view.revertRect(mouse.selectionRect).bounds
      console.log(selRect)
      var inSelection=[]
      for(const r of virtualRects){
        if(selection.includes(r)) continue
        if(selRect.Intersects(r.bounds))
        inSelection.push(r)
      }
      setSelection(inSelection)
      mouse.displaySelectionRect=false
      e.preventDefault()
    }
    else if(mouse.button==0) // select closest object
    {
      var x=view.revertX(e.x)
      var y=view.revertY(e.y)

      var Dist=(x1:number,y1:number,x2:number,y2:number)=>((x1-x2)*view.dx)**2+((y1-y2)*view.dy)**2
      var minDist=200// do not select something if its super far away
      var minRo=null
      if(!keys.Shift) setSelection() // deselects all
      for(var r of virtualRects){
        var dist=0
        if(r instanceof Vector)
          dist=Dist(x,y,(r as Vector).x2,(r as Vector).y2)
        else dist=Dist(x,y,r.x,r.y)
        if(dist<minDist){
          minDist=dist
          minRo=r
        }
      }
      setSelection(minRo,!keys.Shift)
    }
  }
  
  mouse.displaySelectionRect=false
  Render()
})

canvas.addEventListener("mousemove",(e)=>{
  var mouseMoveX=mouse.x-e.x
  var mouseMoveY=mouse.y-e.y
  //mouse.button=e.buttons
  
  if(mouse.button==1) // panning the viewport or drawing
  { 
    if(defineVectorOrPoint){
      canvas.style.cursor="pointer"
      var name=firstFreeName(abc)
      var x=Math.round(view.revertX(e.x)*10000)/10000
      var y=Math.round(view.revertY(e.y)*10000)/10000
      var x0=Math.round(view.revertX(mouse.selectionRect.x)*10000)/10000
      var y0=Math.round(view.revertY(mouse.selectionRect.y)*10000)/10000
      tempRenderable=new Vector(name,null,[x-x0,y-y0],null,x0,y0,graphColors[renderables.length%graphColors.length])
      outputField.innerHTML=name+"="+tempRenderable.toString()
    }else{
      canvas.style.cursor="grabbing"
      mouse.moved+=mouseMoveX**2+mouseMoveY**2
      if(keys.Shift){
        if(Math.abs(mouseMoveX+mouse.momentumX*5)>Math.abs(mouseMoveY+mouse.momentumY*5))
          mouseMoveY=0
        else mouseMoveX=0
      }

      // note: sum=0.9, since we the panning is called faster when the
      // viewport is drifting than when the user is dragging around.
      note:mouse.momentumX=mouseMoveX*0.1+mouse.momentumX*0.8
      note:mouse.momentumY=mouseMoveY*0.1+mouse.momentumY*0.8
      view.pan(mouseMoveX,mouseMoveY)
    }
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

var defineVectorOrPoint=false
canvas.addEventListener("mousedown",(e)=>{
  tempRenderable=null
  if((Date.now()-mouse.clickTime)<200){
    defineVectorOrPoint=true
    var name=firstFreeName(abc)
    var x=Math.round(view.revertX(e.x)*10000)/10000
    var y=Math.round(view.revertY(e.y)*10000)/10000
    tempRenderable=new Point(name,null,x,y,graphColors[renderables.length%graphColors.length])
    outputField.innerHTML=name+"="+tempRenderable.toString()
  }
  mouse.clickTime=Date.now()

  mouse.button=e.buttons
  mouse.selectionRect=new Rect(e.x,e.y,0,0)
  if(mouse.button==2){
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
  style=getComputedStyle(document.documentElement)
  colorSelection=style.getPropertyValue("--selected")
  colorSelectionRect=style.getPropertyValue("--selectionRect")
  colorAxes=style.getPropertyValue("--axes")
  colorGrid=style.getPropertyValue("--grid")
  colorClear=style.getPropertyValue("--canvas-bg")
  clearCanvas()
  ctx.font="16px Arial"

  function Round2(x:number){
    if(Math.abs(x)<1) return x.toFixed(2);
    return x.toString()
  }

  //#region Render grid
  // X-axis
  ctx.lineWidth=1
  ctx.fillStyle=colorAxes
  ctx.strokeStyle=colorAxes
  ctx.beginPath()
  var yT=clamp(view.transformY(),5,canvas.height-23)
  ctx.moveTo(0,yT) ; ctx.lineTo(canvas.width,yT)
  ctx.stroke()
  var notchInterval=getNotchInterval(view.x-view.w,view.x+view.w,canvas.width)
  getAxisNotches(view.x-view.w,view.x+view.w,notchInterval).forEach((x)=>{
    ctx.beginPath()
    xT=view.transformX(x,true)
    ctx.strokeStyle=colorAxes
    ctx.moveTo(xT,yT-5) ; ctx.lineTo(xT,yT+5)
    ctx.stroke()
    ctx.strokeStyle=colorGrid
    ctx.moveTo(xT,0) ; ctx.lineTo(xT,canvas.height)
    if(x!=0)ctx.stroke()
    ctx.fillText(Round2(x),xT-8,yT+18)
  })
  
  // Y-axis
  ctx.strokeStyle=colorAxes
  ctx.beginPath()
  var xT=clamp(view.transformX(),Math.max(50,calcWindow.clientWidth+8),canvas.width-8) //honestly i just like these numbers, no meaning behind them
  var drawNumbersOnRightSide=xT<100+calcWindow.clientWidth
  ctx.moveTo(xT,0) ; ctx.lineTo(xT,canvas.width)
  ctx.stroke()
  notchInterval=getNotchInterval(view.y-view.h,view.y+view.h,canvas.height)
  getAxisNotches(view.y-view.h,view.y+view.h,notchInterval).forEach((y)=>{
    ctx.beginPath()
    yT=view.transformY(y,true)
    ctx.strokeStyle=colorAxes
    ctx.moveTo(xT-5,yT) ; ctx.lineTo(xT+5,yT)
    ctx.stroke()
    ctx.strokeStyle=colorGrid
    ctx.moveTo(0,yT) ; ctx.lineTo(canvas.width,yT)
    if(y!=0)ctx.stroke()
    var yString=Round2(y)
    var stringWidth=ctx.measureText(yString).width
    ctx.fillText(yString,xT-10-stringWidth+(drawNumbersOnRightSide?+20+stringWidth:0),yT+5)
  })
  //#endregion

  legendY=0
  legendX=Math.max(45,calcWindow.clientWidth+10)
  if(calcWindow.clientWidth<15){
    legendY=220
    legendX=14
  }
  if(tempRenderable){
    if(tempRenderable.update) tempRenderable.update!()
    tempRenderable.Render(true)
  }
  for(const i in renderables)
  {
    if(!renderables[i].display) continue
    if(renderables[i].update) renderables[i].update!()
    renderables[i].Render()
  }
    

  if(mouse.displaySelectionRect){
    ctx.fillStyle=colorSelectionRect
    ctx.fillRect( mouse.selectionRect.x,
                  mouse.selectionRect.y,
                  mouse.selectionRect.w,
                  mouse.selectionRect.h)
  }
  
  
}

// Helper functions
function clearCanvas(){
  ctx!.fillStyle=colorClear
  ctx!.fillRect(0,0,canvas!.width,canvas!.height)
}
function clamp(x:number,min:number,max:number){
  if(x<min)return min
  if(x>max)return max
  return x
}
function getNotchInterval(from:number,to:number,size:number){
  var range=Math.abs(to-from)
  var optimalNotchDistance=100*range/(size/50)
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