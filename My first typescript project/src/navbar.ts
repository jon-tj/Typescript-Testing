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
function uploadFile(){

}
function toggleSettings(){

}