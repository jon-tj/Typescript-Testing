
class Terminal{
    lines:string[]; htmlElement:HTMLDivElement;
    constructor(htmlElement:HTMLDivElement){
        this.htmlElement=htmlElement
    }
    show(){
        this.htmlElement.style.height="10em"
    }
    hide(){
        this.htmlElement.style.height="1em"
    }
    print(msg:any){
        this.htmlElement.innerHTML+="<br>"+msg
    }
}
const terminal=new Terminal(document.querySelector('#terminal')!)

