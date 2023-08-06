// VVV edit this to make new menu items ;))
const menuTree={
    'File':{
        'New|Ctrl+N':()=>console.log('new'),
        'Open|Ctrl+O':()=>console.log('open'),
        'Save|Ctrl+S':()=>console.log('save')
    },
    'Edit':{
        'Undo|Ctrl+Z':editor.undo,
        'Redo|Ctrl+Shift+Z':editor.redo,
        'Find|Ctrl+F':()=>console.log('find'),
        'Replace|Ctrl+R':()=>console.log('replace')
    },
    'Run|Ctrl+Q':()=>{
        // Run a selection if it can be found, otherwise run the file
        terminal.show()
        terminal.print('Running...')
        var tab=editor.activeTab
        if(!tab) return
        var selection=tab.selection
        if(selection) tryRunSnippet(selection)
        else tryRunSnippet(tab.content)
    }
}

//#region the glue that makes it all work
const navbar=document.querySelector('#navbar')
const mainEnv=document.querySelector('#main-env')
var root=document.createElement("ul")
var focusedMenu:HTMLElement|null=null
root.classList.add("navbar")
root.classList.add("horizontal")
navbar.append(root)

function hideActiveMenu(){
    if(focusedMenu){
        focusedMenu.classList.add('hidden')
        focusedMenu=null
    }
}
function createMenuItem(parent,obj,name="",level=0){
    if(level==0){
        Object.keys(obj).forEach(key=>{
            parent.append(createMenuItem(parent,obj[key],key,1))
        })
        return
    }
    var li=document.createElement('li')
    if(level==1) li.classList.add("navbar")
    var s=name.split('|')
    li.innerText=s[0]
    if(s.length>1){
        li.innerHTML+="<span>"+s[1]+"</span>"
        shortcutKeys[s[1]]=obj as Function
    }
    parent.append(li)
    if(obj instanceof(Function)){
        li.addEventListener('click',obj)
        li.classList.add("show")
        if(level==1) li.addEventListener('mouseenter',()=>{
            if(focusedMenu){
                focusedMenu.classList.add("hidden")
                focusedMenu=li
            }
        })
    }
    else{
        var r=document.createElement("ul")
        r.classList.add("navbar")
        r.classList.add("vertical")
        r.classList.add("hidden")
        li.append(r)
        //#region toggle when clicked
        li.addEventListener('mouseenter',()=>{
            if(focusedMenu && focusedMenu!=r){
                focusedMenu.classList.add("hidden")
                focusedMenu=r
                focusedMenu.classList.remove("hidden")
            }
        })
        li.addEventListener('click',(e)=>{
            if(focusedMenu==r){
                focusedMenu.classList.add("hidden")
                focusedMenu=null
            }else{
                focusedMenu=r
                focusedMenu.classList.remove("hidden")
            }
            e.preventDefault()
        })
        //#endregion
        Object.keys(obj).forEach(key=>{
            r.append(createMenuItem(r,obj[key],key,level+1))
        })
    }
    return li
}
const shortcutKeys:{[key:string]:Function}={}

createMenuItem(root,menuTree)

mainEnv.addEventListener('click',hideActiveMenu)

document.body.addEventListener('keydown',(e)=>{
    var shc=(e.ctrlKey?"Ctrl+":"")+(e.shiftKey?"Shift+":"")+e.key.toUpperCase()
    if(shortcutKeys[shc]) shortcutKeys[shc]()
})
//#endregion