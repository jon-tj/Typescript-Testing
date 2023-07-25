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
  var adv= document.querySelector<HTMLElement>("#advanced-settings-container")!
  var advInner= document.querySelector<HTMLElement>("#advanced-settings")!
  if(adv.clientHeight<30){
    adv.style.height=advInner.clientHeight+"px"
  }
  else{
    adv.style.height="0px"
  }
}
function reset(){
  view=new Viewport()
  mouse.momentumX=0
  mouse.momentumY=0
  keys.Shift=false
  keys.Control=false
  setSelection()
  Render()
}