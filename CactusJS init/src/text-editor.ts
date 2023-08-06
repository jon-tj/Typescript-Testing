
class Tab{
    selectionIdx:{start:number,end:number}
    undoLog:UndoAction[]
    undoLogCursor:number
    constructor(public title:string, public content:string){
        this.title = title
        this.content = content
        this.undoLog=[]
        this.undoLogCursor=-1
        this.selectionIdx={start:0,end:0}
    }
    get selection():string|null{
        if(this.selectionIdx.start==this.selectionIdx.end) return null
        var minIdx=Math.min(this.selectionIdx.start,this.selectionIdx.end)
        var maxIdx=Math.max(this.selectionIdx.start,this.selectionIdx.end)
        //? should it be maxIdx+1? or just maxIdx?
        return this.content.substring(minIdx,maxIdx+1)
    }
    write(c:string){
        this.content=this.content.slice(0,this.selectionIdx.start)+c+this.content.slice(this.selectionIdx.end)
        this.selectionIdx.start+=c.length
        this.selectionIdx.end=this.selectionIdx.start
    }
}
class Editor{
    canvas:HTMLCanvasElement
    tabs:Tab[]
    activeTabIdx:number|null
    constructor(canvas:HTMLCanvasElement,tabs:Tab[]=[]){
        this.canvas=canvas
        this.tabs = tabs
        this.activeTabIdx = null
    }
    get isEmpty(){return this.tabs.length == 0}
    get selection():string|null{
        if(this.activeTab)
            return this.activeTab.selection
        else return null
    }
    get activeTab():Tab|null{
        if(this.activeTabIdx && this.activeTabIdx>=0)
            return this.tabs[this.activeTabIdx]
        return null
    }
    undo(){
        var tab=this.activeTab
        if(tab && tab.undoLog.length > 0 && tab.undoLogCursor >= 0){
            tab.undoLog[tab.undoLogCursor].undo()
            tab.undoLogCursor--
        }
    }
    redo(){
        var tab=this.activeTab
        if(tab && tab.undoLog.length > 0 && tab.undoLogCursor < tab.undoLog.length-1){
            tab.undoLog[tab.undoLogCursor].redo()
            tab.undoLogCursor++
        }
    }
    closeTab(tabIdx:number=-1){
        if(tabIdx == -1){
            if(this.activeTabIdx) tabIdx=this.activeTabIdx
            else return
        }
        this.tabs.splice(tabIdx,1)
        this.activeTabIdx=Math.min(this.activeTabIdx,this.tabs.length-1)
        if(this.activeTabIdx == -1) this.activeTabIdx=null
    }
    write(c:string){
        var tab=this.activeTab
        if(tab) tab.write(c)
    }
}
class UndoAction{
    constructor(public editor:Editor){
        this.editor = editor
    }
    undo(){
        //!not implemented
    }
    redo(){
        //!not implemented
    }
}

document.body.addEventListener('keydown',(e)=>{
    editor.write(e.key)
})