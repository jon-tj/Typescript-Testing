function doupload() {
    let fileInput = document.querySelector<HTMLInputElement>("#file-upload")!;
    if (fileInput.files && fileInput.files[0]) {
      let file = fileInput.files[0];
      let reader = new FileReader();

      reader.onload = function(event) {
        if(event.target && event.target.readyState==2){
            let content = event.target!.result as string
            var name=fileInput.files![0].name.split('.')[0]
            name=name.replaceAll("(","").replaceAll(")","").replaceAll(" ","")
            var df = DataFrame.FromCSV(content,name)
            addRenderable(df)
            eval(name+"=df")
            df.htmlNode=appendLog(name,"dataframe ("+df.dataPrimitiveType+")","(cannot edit dataframe directly)",name)
            Render()
        }
      }
      reader.readAsText(file);
    }
}

class DataFrame extends Renderable{
    //TIP: use df.toString to check contents ;)
    cells:any[][]
    maxVal:number
    primaryRow:string[] ; primaryColumn:string[]
    dataPrimitiveType:string
    constructor(name:string,htmlNode:HTMLElement|null,cells:string[][],primaryRowIdx:number=0,primaryColumnIdx:number=0){
        super(name,htmlNode)
        this.cells=cells
        this.primaryRow=this.row(primaryRowIdx)
        this.primaryColumn=this.column(primaryColumnIdx)
        this.maxVal=0
        // try to determine source of data, for optimal rendering
        const headers=this.row(primaryRowIdx)
        if(headers.includes("Close") && headers.includes("Date"))
            this.dataPrimitiveType="yf"
        else if(headers[0]=='') // a fun quirk ssb has
            this.dataPrimitiveType="ssb"
        else
            this.dataPrimitiveType="unknown"

        // clean up the data and prepare viewport
        if(this.dataPrimitiveType=="yf"){
            const timeCol=this.column(0)
            var closeCol=this.column(4)
            const development=[]
            const K=1/ (1000 * 3600 * 24)// from seconds to days since epoch
            for(var i=0; i<timeCol.length; i++){
                timeCol[i]=Date.parse(timeCol[i])*K
                if(i==0) development.push(0)
                else development.push(closeCol[i]/closeCol[i-1]-1)
            }
            this.addColumn(timeCol)
            this.addColumn(development)
            this.removeRow(0)
            closeCol=this.column(4)
            this.removeColumn(0)
            this.numeric()
            this.maxVal=Math.max(... this.column(5))
            view.w=100
            var max=Math.max(...closeCol.slice(-view.w))
            var min=Math.min(...closeCol.slice(-view.w))
            view.h=(max-min)/2 *1.5 // some white space between screen edges and graph
            view.x=-view.w*0.7
            view.y=(max+min)/2
        }
        else if(this.dataPrimitiveType=="ssb"){

        }
        
    }
    numeric(){
        for(const row of this.cells){
            for(const i in row)
                row[i]=parseFloat(row[i])
        }
    }
    row(i:number){
        if(i<0 || i>=this.cells.length)
            throw "index outside dataframe: "+i
        return this.cells[i]
    }
    removeRow(i:number){
        this.cells.splice(i,1)
    }

    column(j:number){
        if(j<0 || this.cells.length==0 || j>=this.cells[0].length)
            throw "index outside dataframe: "+j
        var c=[]
        for(const row of this.cells)
            c.push(row[j])
        return c
    }
    addColumn(a:any[]){
        if(a.length!=this.cells.length) throw "column size does not match dataframe: "+a
        for(const i in this.cells)
            this.cells[i].push(a[i])
    }
    removeColumn(j:number){
        for(const row of this.cells)
            row.splice(j,1)
    }
    static FromCSV(msg:string,name:string="New Dataframe",htmlNode:HTMLElement|null=null){
        var rows=msg.split('\n')
        var cells=[]
        for(const row of rows){
            var rowElements=row.split(/[,;]/)
            cells.push(rowElements)
        }
        return new DataFrame(name,htmlNode,cells)
    }
    toString(){
        var msg=""
        for(const row of this.cells){
            msg+=row.join(', ')+'\n'
        }
        return msg
    }
    Render(){
        switch(this.dataPrimitiveType){
            case 'yf': // draws a candlestick graph
                ctx.fillStyle=this.color
                ctx.fillText(this.name,view.transformX(0),view.transformY(this.cells[this.cells.length-1][3]))
                const y0=Math.min(view.transformY(),canvas.height-23)
                const volMul=Math.min(view.dy*10,canvas.height)/this.maxVal
                var i=0
                for(const row of this.cells){
                    var days=++i-this.cells.length
                    //var days=row[6]-this.cells[this.cells.length-1][6]
                    var x1=view.transformX((days-1))
                    var x2=view.transformX((days))
                    var open=view.transformY(row[0])
                    var high=view.transformY(row[1])
                    var low=view.transformY(row[2])
                    var close=view.transformY(row[3])
                    var volume=row[5]
                    if(this.isSelected){
                        ctx.fillStyle= tempColor
                        ctx.fillRect(x1,y0,view.dx,-volume*volMul)
                    }
                    var development=row[7]
                    ctx.fillStyle= development>0?"green":"red"
                    ctx.fillRect((x1+x2)/2,low,1,high-low)
                    ctx.fillRect(x2,close,x1-x2,open-close)
                }
                break
            case 'ssb':
                break
            default:
                throw 'cry about it'
        }
    }
    get bounds(): Rect {
        return new Rect(Infinity,Infinity,-1,-1)
    }
}