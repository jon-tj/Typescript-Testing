const keys={}
const scrollTopOffset=50 // distance from top the scrollCapture sits on

//#region Canvas only events
canvas.addEventListener("mouseenter",(e)=>{render()})
scrollCapture.addEventListener("scroll",(e)=>{
    var dir=Math.sign(scrollCapture.scrollTop-scrollTopOffset)
    scrollCapture.scrollTop=scrollTopOffset
    var scrollOffset=dir*9
    var tab=editor.activeTab
    if(tab!=null){
        if(keys['Shift']){
            /*
            tab.scrollX+=scrollOffset
            if(tab.scrollX<0) tab.scrollX=0
            if(tab.scrollX)
            */
        }else{
            tab.scrollY+=scrollOffset
            if(tab.scrollY<0) tab.scrollY=0
            if(tab.scrollY>=tab.pageHeight) tab.scrollY=tab.pageHeight
        }
        render()
    }
})
//#endregion

//#region Window events
window.addEventListener('keydown',(e)=>{
    var shc=(e.ctrlKey?"Ctrl+":"")+(e.shiftKey?"Shift+":"")+e.key.toUpperCase()
    if(shortcutKeys[shc]) shortcutKeys[shc]()
    keys[e.key]=true
})
window.addEventListener('keyup',(e)=>{
    keys[e.key]=false
})

var resizeCanvas=null
window.addEventListener("resize", resizeCanvas=()=>{
    canvas.width=window.innerWidth-explorer.clientWidth
    canvas.height=window.innerHeight+100
    scrollCapture.style.height=canvas.clientHeight-100+"px"
    scrollCapture.scrollTop=scrollTopOffset
    if(typeof render === 'function') render()
});

//#endregion

// since this includes the first render call, this should be called last.
resizeCanvas();