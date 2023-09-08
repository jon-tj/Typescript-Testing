/// <reference path="calc.ts"/>

function toggleFullscreen() {
    // Check if the document is currently in fullscreen mode
    if (!document.fullscreenElement) {
      // If not, request fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else {
      // If already in fullscreen, exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
function emptyLog(){
    while (logBox!.firstChild) {
        logBox!.removeChild(logBox!.firstChild);
    }
    renderables.length=0 // removes all renderables
    Render()
}
function downloadFile(){

}
function toggleSettings(){
  var open=false
  if(calcWindow.clientWidth<100){ // make sure the calc window is opened and wide enough
    if(lastCalcWindowWidth<100) lastCalcWindowWidth=100
    calcWindow.style.width=lastCalcWindowWidth+"px"
    open=true
  }

  var adv= document.querySelector<HTMLElement>("#advanced-settings-container")!
  var advInner= document.querySelector<HTMLElement>("#advanced-settings")!
  if(adv.clientHeight<30 || open){ // if we opened the calc window to view the settings
    adv.style.height=advInner.clientHeight+"px"
  }
  else{
    adv.style.height="0px"
  }
}

// advanced settings
function reset(){
  view=new Viewport()
  mouse.momentumX=0
  mouse.momentumY=0
  keys.Shift=false
  keys.Control=false
  setSelection()
  Render()
}
function toggleTheme(){
  var img=document.querySelector<HTMLImageElement>("#theme-button-img")!
  var theme=document.querySelector<HTMLLinkElement>("#theme-link")!
  if(img.style.top=="0px"){
    img.style.top="-32px"
    theme.href="/theme-night.css"
  }else{
    img.style.top="0px"
    theme.href="/theme-day.css"
  }
  mouse.momentumX=0.01 // hack to make the screen render ;)
}