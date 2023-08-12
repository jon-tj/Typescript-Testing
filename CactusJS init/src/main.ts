const canvas=document.querySelector<HTMLCanvasElement>('#editor-canvas')!
const scrollCapture=document.querySelector<HTMLCanvasElement>('#scroll-capture')!
const ctx=canvas.getContext('2d')!

const explorer=document.querySelector<HTMLElement>('#explorer')!
const editor=new Editor(canvas)
// debug tab:
editor.tabs.push(new Tab("New Tab",
`# My text:
i am **bold**
Yes sir *please*
this is ***really*** important
$x+1=\\frac{2}{5}$
testing _underline_! but dont do it in math: $x_i=i_2+4+x_{i-1}+\\sum^{10}_{k=1}k -\\tfrac{2 \\cdot a}{3}$
its *very* !!important!! that this is done correctly! The lives of \`1\` person(s) depends on it.
\`\`\`py
def getColumnExact(self,column,condition=""):
    # fill zero where no entry was found
    if column=="time":
        out=[t for t in self.columns["time"]]
    else: out=[0]*len(self)
    i=0
    for e in self.columns[column]:
        if column=="time": i+=1231241735473
        else:
            i=self.columns["time"].index(e["time"]) #see [../notes/note.md]
            out[i]=e["value"] #! **extremely** out-dated! use   $x=\\tfrac{2}{3}$ 
        if len(condition)>0: # this is *very* important 
            time=e if column=="time" else e["time"] #? is this really necessary?
            checkFields=self.getRowExact(time) #* this is actually _vital_
            checkFields["time"]=time
            for c in checkFields:
                if condition in checkFields[c]:
                    del out[i]
                    print("deleted",i)
                    i-=1
                    break
\`\`\`
[www.google.com|Im a link]
# yeah
- numba 1\n- numero dos\n[../notes/note.md]`))
editor.tabs.push(new Tab("silly notes","not so important"))