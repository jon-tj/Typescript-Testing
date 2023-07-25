function dist(obj:any,nBins:number=10){
    console.log("hey!")
    if(obj instanceof Array){
        var ro=new Distribution(firstFreeName(distNames),null,obj,nBins)
        console.log(ro.name)
        eval(ro.name+"=ro")
        addRenderable(ro)
        Render()
        return ro.toString()
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
        var minXt=view.transformX(this.minX)
        var maxXt=view.transformX(this.maxX)
        ctx.fillStyle=this.color
        ctx.fillRect(minXt,0,maxXt,100)
        ctx.fillRect(0,0,1000,100)
        
    }
    get bounds():Rect{
        return new Rect(this.minX,this.y-this.maxCount ,this.maxX-this.minX,this.maxCount)
    }
}