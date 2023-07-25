const selectionOutline="red"
const tempColor="#ccc"
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
    toString():string{return typeof(this).toString()}
    name:string; x:number; y:number; color: string; angle:number; update:Function|null; display:boolean; htmlNode:HTMLElement|null
    constructor(name:string,htmlNode:HTMLElement|null, x:number=0,y:number=0, color:string|null=null, update:Function|null=null){
        this.name=name
        this.htmlNode=htmlNode
        this.x=x
        this.y=y
        if(color) this.color=color
        else this.color="#333"
        this.angle=0
        this.update=update
        this.display=true
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
    Legend(msg:string){
        legendY+=25
        ctx.fillStyle=this.color
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
            ctx.fillStyle = selectionOutline;
            ctx.beginPath();
            ctx.arc(x,y, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
        if(temp) ctx.fillStyle = tempColor
        else{
            ctx.fillStyle = this.color
            ctx.fillText(this.name,x+8,y+5)
        }
        ctx.beginPath();
        ctx.arc(x,y, 6, 0, 2 * Math.PI);
        ctx.fill();
    }
}
class Vector2 extends Renderable{
    toString(): string { return "("+this.w+", "+this.h+")"}
    w:number; h:number
    constructor(name:string,htmlNode:HTMLElement|null, x2: number, y2: number,x1:number=0,y1:number=0, color:string|null=null, update:Function|null=null) {
        super(name,htmlNode,x2, y2,color,update);
        this.w=x1
        this.h=y1
    }
    get x2(){return this.x+this.w}
    get y2(){return this.y+this.h}

    get bounds():Rect{ return this.boundsSigned.bounds } // calling bounds makes x1 smaller than x2 etc
    get boundsSigned():Rect{return new Rect(this.x,this.y,this.w,this.h)}
    get magnitude(){return Math.sqrt(this.w**2+this.h**2)}
    Render(temp:boolean=false){
        if(super.update) super.update()

        var r= view.transformRect(this.bounds)
        ctx.fillStyle = this.color
        ctx.strokeStyle = this.color

        if(this.isSelected) ctx.lineWidth=3
        else ctx.lineWidth=1

        var magnitude=this.magnitude
        var normX=this.w/magnitude
        var normY=this.h/magnitude
        var arrowHeadSize=Math.min(magnitude*0.1,0.2)

        if(temp) ctx.strokeStyle=tempColor
        else{
            var offsetY=5-Math.sign(this.h)*12
            ctx.fillText(this.name,r.x2,r.y2+offsetY)
            ctx.strokeStyle=this.color
        }
        ctx.beginPath()
        ctx.moveTo(r.x,r.y)
        ctx.lineTo(r.x2,r.y2)
        ctx.lineTo(r.x2,r.y2)
        ctx.lineTo(view.transformX(this.x2+(normY-normX)*arrowHeadSize),view.transformY(this.y2-(normX+normY)*arrowHeadSize))
        ctx.moveTo(r.x2,r.y2)
        ctx.lineTo(view.transformX(this.x2-(normY+normX)*arrowHeadSize),view.transformY(this.y2+(normX-normY)*arrowHeadSize))
        ctx.stroke()
        
        
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
        
        if(temp) ctx.strokeStyle=tempColor
        else{
            this.Legend(this.name+"(x)")
            ctx.strokeStyle=this.color
        }
        ctx.stroke()
    }
    get bounds():Rect{
        return new Rect(this.x,this.y,0,0)
    }
}
class Distribution extends Renderable{
    bins:number[]; minX:number; maxX:number; data:number[]; maxCount:number
    constructor(name:string,htmlNode:HTMLElement|null, data:number[],nBins:number,color:string|null=null, update:Function|null=null){
        super(name,htmlNode,0,0,color,update)
        this.data=data
        this.minX=Math.min(...data)
        this.maxX=Math.max(...data)

        var sorted=structuredClone(data).sort((a, b) => a - b)
        var binIdx=0
        var increment=(this.maxX-this.minX)/nBins
        var binThreshold=this.minX+increment
        this.bins=[]

        for(const v of sorted){
            if(v>binThreshold){
                binThreshold+=increment
                binIdx++
                this.bins.push(0)
            }
            this.bins[binIdx]++
        }
        this.maxCount=Math.max(...this.bins)

    }
    Render(temp:boolean=false){
        if(super.update) super.update()
        
    }
    get bounds():Rect{
        return new Rect(this.minX,this.y-this.maxCount ,this.maxX-this.minX,this.maxCount)
    }
}
class Matrix extends Renderable{
    cells:number[][]
    rows:number
    columns:number

    constructor(name:string,htmlNode:HTMLElement|null, cells:number[][],rows:number,columns:number=1,x:number=0,y:number=0, update:Function|null=null){
        super(name,htmlNode,x,y)
        this.cells=cells // [[a,b],[c,d]]
        this.rows=rows
        this.columns=columns
        super.update=update
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
    mulVec(v:Vector2){
        var V=new Matrix("V",v.htmlNode,[],this.columns)
        if(this.rows==2)
            V.cells=[[v.w,v.h]]
        else if(this.rows==3)
            V.cells=[[v.w,v.h,1]]
        else if(this.rows==4)
            V.cells=[[v.w,v.h,v.x,v.y]]
        else if(this.rows==5)
            V.cells=[[v.w,v.h,v.x,v.y,1]]
        else throw("Matrix sizes do not match up!")
        var u=this.mul(V)
        if(this.rows==2)
            alert("a")    
        //return new Vector()
        else if(this.rows==3)
            V.cells=[[v.w,v.h,1]]
        else if(this.rows==4)
            V.cells=[[v.w,v.h,v.x,v.y]]
        else if(this.rows==5)
            V.cells=[[v.w,v.h,v.x,v.y,1]]
    }
    mul(m:Matrix):Matrix{
        throw("Not implemented yet")
    }
    
    Render(temp:boolean=false){
        if(super.update) super.update()

    }
    get bounds():Rect{
        return new Rect(this.x,this.y,this.columns,this.rows)
    }
}
