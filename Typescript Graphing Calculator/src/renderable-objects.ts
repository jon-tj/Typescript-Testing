var style=getComputedStyle(document.documentElement)
var colorSelection=style.getPropertyValue("--selected")
var colorSelectionRect=style.getPropertyValue("--selectionRect")
var colorAxes=style.getPropertyValue("--axes")
var colorGrid=style.getPropertyValue("--grid")
var colorClear=style.getPropertyValue("--canvas-bg")
const thinLine=1
const thickLine=3

class Rect{
    x:number;y:number;w:number;h:number
    constructor(x:number,y:number,w:number,h:number){
        this.x=x
        this.y=y
        this.w=w
        this.h=h
    }
    get x2(){return this.x+this.w}
    get y2(){return this.y+this.h}

    Intersects(r:Rect):boolean{
        return this.x2>=r.x && r.x2>=this.x && 
        this.y2>=r.y && r.y2>=this.y
    }
    get bounds():Rect{
        var minX=Math.min(this.x,this.x2)
        var maxX=Math.max(this.x,this.x2)
        var minY=Math.min(this.y,this.y2)
        var maxY=Math.max(this.y,this.y2)
        return new Rect(minX,minY,maxX-minX,maxY-minY)
    }
}

class Renderable{
    toString():string{return this.name+":"+ typeof(this).toString()}
    name:string; x:number; y:number; angle:number; update:Function|null; display:boolean; htmlNode:HTMLElement|null
    options:{[key:string]:string}
    virtual:Renderable[]
    constructor(name:string,htmlNode:HTMLElement|null, x:number=0,y:number=0, color:string|null=null, update:Function|null=null){
        this.name=name
        this.htmlNode=htmlNode
        this.x=x
        this.y=y
        if(!color)color="#333"
        this.angle=0
        this.update=update
        this.display=true
        this.options={"color":color}
        this.virtual=[]
    }
    get bounds():Rect{
        return new Rect(this.x,this.y,0,0) // point
    }
    Delete(){
        if(this.htmlNode) this.htmlNode.remove()
        for (const i in renderables) {
            if (renderables[i] === this) {
                delete renderables[i];
                break; // No need to continue searching
            }
        }
    }
    get isSelected(){ return selection.includes(this) }
    Render(temp:boolean=false){throw "Do not render Renderable primitive >:("}
    setOption(optName:string,value:string){ // virtual
        this.options[optName]=value
    }
    Legend(msg:string){
        legendY+=25
        ctx.fillStyle=this.options.color
        ctx.fillText(msg,legendX,legendY)
    }
}
class Point extends Renderable{
    toString(): string { return "("+this.x+", "+this.y+")"}
    constructor(name:string,htmlNode:HTMLElement|null, x: number, y: number, color:string|null=null, update:Function|null=null) {
        super(name,htmlNode,x, y,color,update);
    }
    Render(temp:boolean=false){
        if(super.update) super.update()
        var x=view.transformX(this.x)
        var y=view.transformY(this.y)

        if(this.isSelected){
            ctx.fillStyle = colorSelection;
            ctx.beginPath();
            ctx.arc(x,y, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
        if(temp) ctx.fillStyle = colorAxes
        else{
            ctx.fillStyle = this.options.color
            ctx.fillText(this.name,x+8,y+5)
        }
        ctx.beginPath();
        ctx.arc(x,y, 6, 0, 2 * Math.PI);
        ctx.fill();
    }
    RenderVirtual(){
        var x=view.transformX(this.x)
        var y=view.transformY(this.y)

        if(this.isSelected){
            ctx.fillStyle = colorSelection;
            ctx.beginPath();
            ctx.arc(x,y, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.fillStyle = this.options.color
        ctx.beginPath();
        ctx.arc(x,y, 6, 0, 2 * Math.PI);
        ctx.fill();
    }
}
class Graph extends Renderable{
    func:Function
    constructor(name:string,htmlNode:HTMLElement|null, func:Function,color:string|null=null, update:Function|null=null){
        super(name,htmlNode,Infinity,Infinity,color,update) // not supposed to be able to select it like that
        this.func=func
    }
    Render(temp:boolean=false){
        if(super.update) super.update()
        
        
        var sx=0 // start at left edge of screen
        var sy=view.revertY(this.func(view.x-view.w))
        ctx.moveTo(sx,sy)
        ctx.beginPath()

        var inc=view.w / 2000 // the resolution of the graph
        var sInc=inc*view.dx
        for(var x=view.x-view.w; x<view.x+view.w+inc; x+=inc){ //+1 inc to render even when partially off-cam
            sx+=sInc
            sy=view.transformY(this.func(x))
            var render:boolean=(sy<canvas.height && sy>0)
            if(render)ctx.lineTo(sx,sy)
            // overshoot a little so lines coming onto the screen have the correct direction
            else ctx.moveTo(sx,clamp(sy,-100,canvas.height+100)) 
        }
        
        if(this.isSelected) ctx.lineWidth=3
        else ctx.lineWidth=1
        
        if(temp) ctx.strokeStyle=colorAxes
        else{
            this.Legend(this.name+"(x)")
            ctx.strokeStyle=this.options.color
        }
        ctx.stroke()
    }
    get bounds():Rect{
        return new Rect(this.x,this.y,0,0)
    }
}
class Matrix extends Renderable{
    cells:number[][]
    rows:number
    columns:number

    constructor(name:string,htmlNode:HTMLElement|null, cells:number[][],rows:number,columns:number=1,x:number=0,y:number=0, update:Function|null=null){
        super(name,htmlNode,x,y,null,update)
        this.cells=cells // [[a,b],[c,d]]
        this.rows=rows
        this.columns=columns
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
    mulVec(v:Vector){
        var V=new Matrix("V",v.htmlNode,[],this.columns)
        if(this.rows==2)
            V.cells=[[v.get(0),v.get(1)]]
        else if(this.rows==3)
            V.cells=[[v.get(0),v.get(1),1]]
        else if(this.rows==4)
            V.cells=[[v.get(0),v.get(1),v.x,v.y]]
        else if(this.rows==5)
            V.cells=[[v.get(0),v.get(1),v.x,v.y,1]]
        else throw("Matrix sizes do not match up!")
        var u=this.mul(V)
        if(this.rows==2)
            alert("a")    
        //return new Vector()
        else if(this.rows==3)
            V.cells=[[v.get(0),v.get(1),1]]
        else if(this.rows==4)
            V.cells=[[v.get(0),v.get(1),v.x,v.y]]
        else if(this.rows==5)
            V.cells=[[v.get(0),v.get(1),v.x,v.y,1]]
    }
    mul(m:Matrix):Matrix{
        throw("Not implemented yet")
    }

    
    Render(temp:boolean=false){
        if(super.update) super.update()

        if(!temp){
            ctx.fillStyle=this.options.color
            ctx.fillText(this.name,view.transformX(0),view.transformY(0))
        }
        ctx.fillStyle=colorClear
        var x0=view.transformX(0)
        var y0=view.transformY(0)
        ctx.fillRect(x0,y0,view.transformX(this.columns)-x0-1,view.transformY(-this.rows)-y0-1)
        if(this.isSelected){
          ctx.strokeStyle=colorSelection
          ctx.lineWidth=7
          ctx.strokeRect(x0-4,y0-4,view.transformX(this.columns)-x0+6,view.transformY(-this.rows)-y0+6)
        }
        
        ctx.strokeStyle=this.options.color
    
        var min=this.min()
        var max=this.max()
        var dx=view.dx
        var dy=view.dy
        for(var i=0; i<this.rows; i++){
          for(var j=0; j<this.columns; j++){
            
            ctx.fillStyle="hsl("+remap(this.get(i,j),min,max,230,0)+", 80%, 50%)"
            ctx.fillRect(view.transformX(j)-1,view.transformY(-i)-1,dx,dy)
            if(view.h>8)continue
            ctx.fillStyle=graphColors[0]
            ctx.fillText(this.get(i,j).toString(),view.transformX(j+0.5)-5,view.transformY(-i-0.5)+5)
          }
        }
    }
    get bounds():Rect{
        return new Rect(this.x,this.y,this.columns,-this.rows).bounds
    }
}
class Vector extends Renderable{
    cells:number[]
    toString(): string {
        return "["+this.cells.join(", ")+"]"
    }
    constructor(name:string,htmlNode:HTMLElement|null, cells:number[], update:Function|null=null,x:number=0,y:number=0,color:string="#000"){
        super(name,htmlNode,x,y,color,update)
        this.cells=cells
    }
    get x2(){return this.x+this.get(0)}
    get y2(){return this.y+this.get(1)}
    get(i:number){
        return this.cells[i]
    }
    set(value:number,i:number){
        this.cells[i]=value
    }
    iter(f:Function){
        for(var i=0; i<this.length; i++)
            this.set(f(i),i)
    }
    get length(){return this.cells.length}
    max(){ return Math.max(...this.cells)
    }
    min(){ return Math.min(...this.cells)
    }
    norm(){
        var mean=0
        for(var j=0; j<this.cells.length; j++) mean+=this.cells[j]
        mean/=this.cells.length
        var std=0
        for(var j=0; j<this.length; j++) std+=(this.get(j)-mean)**2
        std=Math.sqrt(std/this.length)
        for(var j=0; j<this.length; j++) this.set((this.get(j)-mean)/std,j)
    }
    transpose(){
        return new Matrix(this.name+"^T",this.htmlNode,[this.cells],1,this.length)
    }
    dot(v:Vector){
        var sum=0
        for(var i=0; i<this.length; i++)
            sum+=this.get(i)*v.get(i)
        return sum
    }get bounds():Rect{ return this.boundsSigned.bounds } // calling bounds makes x1 smaller than x2 etc
    get boundsSigned():Rect{return new Rect(this.x,this.y,this.get(0),this.get(1))}
    get magnitude2d(){return Math.sqrt(this.get(0)**2+this.get(1)**2)}
    get magnitude(){return Math.sqrt(this.dot(this))}
    
    Render(temp:boolean=false){
        if(super.update) super.update()
        
        var r= view.transformRect(this.boundsSigned)
        ctx.fillStyle = this.options.color
        ctx.strokeStyle = this.options.color

        if(this.isSelected) ctx.lineWidth=3
        else ctx.lineWidth=1

        var magnitude=this.magnitude
        var normX=r.w/magnitude
        var normY=r.h/magnitude
        var arrowHeadSize=Math.min(magnitude*0.2,15/view.dx)
        //Math.min(magnitude*0.1,0.2)
        if(temp) ctx.strokeStyle=colorAxes
        else{
            var offsetY=5-Math.sign(this.get(1))*12
            ctx.fillText(this.name,r.x2,r.y2+offsetY)
            ctx.strokeStyle=this.options.color
        }
        ctx.beginPath()
        ctx.moveTo(r.x,r.y)
        ctx.lineTo(r.x2,r.y2)
        ctx.lineTo(r.x2,r.y2)
        ctx.lineTo(r.x2+(normY-normX)*arrowHeadSize,r.y2-(normX+normY)*arrowHeadSize)
        ctx.moveTo(r.x2,r.y2)
        ctx.lineTo(r.x2-(normY+normX)*arrowHeadSize,r.y2+(normX-normY)*arrowHeadSize)
        ctx.stroke()
    }
    
    RenderVirtual(){
        var r= view.transformRect(this.boundsSigned)
        ctx.fillStyle = this.options.color
        ctx.strokeStyle = this.options.color

        if(this.isSelected) ctx.lineWidth=3
        else ctx.lineWidth=1

        var magnitude=this.magnitude
        var normX=r.w/magnitude
        var normY=r.h/magnitude
        var arrowHeadSize=Math.min(magnitude*0.07,5/view.dx)

        ctx.strokeStyle=this.options.color
        ctx.beginPath()
        ctx.moveTo(r.x,r.y)
        ctx.lineTo(r.x2,r.y2)
        ctx.lineTo(r.x2,r.y2)
        ctx.lineTo(r.x2+(normY-normX)*arrowHeadSize,r.y2-(normX+normY)*arrowHeadSize)
        ctx.moveTo(r.x2,r.y2)
        ctx.lineTo(r.x2-(normY+normX)*arrowHeadSize,r.y2+(normX-normY)*arrowHeadSize)
        ctx.stroke()
    }
}
class Candle extends Renderable{
    open:number;high:number;low:number; close:number; volume:number
    constructor(name:string,x:number,open:number,high:number,low:number,close:number,volume:number){
        super(name,null,x,open,close>open?"#1f3":"#f13")
        this.open=open
        this.high=high
        this.low=low
        this.close=close
        this.volume=volume
    }
    RenderVirtual(xT:number){ // Saves some on resources ;)
        var x2=xT-view.dx
        var open=view.transformY(this.open)
        var high=view.transformY(this.high)
        var low=view.transformY(this.low)
        var close=view.transformY(this.close)
        
        ctx.fillStyle= this.options.color
        if(this.isSelected){
            ctx.fillStyle= colorSelection
            ctx.fillRect((xT+x2)/2-1,low-1,3,high-low)
        }
        ctx.fillRect((xT+x2)/2,low,1,high-low)
        ctx.fillRect(x2,close,xT-x2,open-close)
    }
    
    Render(){this.RenderVirtual(view.transformX(this.x))}
}