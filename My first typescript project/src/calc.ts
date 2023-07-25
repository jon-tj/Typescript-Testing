
/// <reference path="index.ts"/>

// Preferences
const abc="abcdefghijklmnopqrstuvw" // names for everything else
const fgh="fghklmnopqrstuv" // function names
const mno="MNOPQRSTUVW" // matrix names
const distNames="DEFGHIJKL"

// Synonyms
const synonyms={
  "sqrt":"Math.sqrt",

  "sin":"Math.sin",
  "cos":"Math.cos",
  "tan":"Math.tan",
  "asin":"Math.asin",
  "acos":"Math.acos",
  "atan":"Math.atan",
  "sin'":"Math.cos",
  "cos'":"-Math.sin",
  "sin^-1":"Math.asin",
  "cos^-1":"Math.acos",
  "tan^-1":"Math.atan",
  "sinh":"Math.sinh",
  "cosh":"Math.cosh",
  "tanh":"Math.tanh",
  "asinh":"Math.asinh",
  "acosh":"Math.acosh",
  "atanh":"Math.atanh",
} as {[key:string]:string}

// Select HTML objects
const logBox=document.querySelector<HTMLUListElement>("#log-box")!
const consoleForm=document.querySelector<HTMLInputElement>("#console-form")!
const consoleInput=document.querySelector<HTMLInputElement>("#console-input")!
const outputField=document.querySelector<HTMLParagraphElement>("#output-field")!
consoleInput.focus()

//#region Calc window listeners
// Drag calc window or double click to hide/show
const calcWindow=document.querySelector<HTMLDivElement>("#calc-window")!
const calcWindowDragArea=document.querySelector<HTMLDivElement>("#calc-window-drag-area")!
calcWindowDragArea.addEventListener("mousemove",(e)=>{
  e.preventDefault()
  if(e.buttons==1 && dragCalcWindow){
    calcWindow.style.width=e.x+"px"
    // Since the advanced settings box is absolutely positioned, it looks dumb if we
    // resize the window with the settings open, so just close it
    document.querySelector<HTMLElement>("#advanced-settings-container")!.style.height="0px"
    calcWindowDragArea.style.left="calc(100% - 8em)"
    calcWindowDragArea.style.right="-8em"
  }else{
    dragCalcWindow=false
    calcWindowDragArea.style.left="calc(100% - 1em)"
    calcWindowDragArea.style.right="-1em"
  }
  calcWindow.classList.add("drag")
  Render()
})
let lastCalcWindowWidth=0
let dragCalcWindow=false
calcWindowDragArea.addEventListener("mousedown",(e)=>{
  dragCalcWindow=true
})
calcWindowDragArea.addEventListener("dblclick",(e)=>{
  if(calcWindow.clientWidth>200){
  lastCalcWindowWidth=calcWindow.clientWidth
  calcWindow.style.width="5px"
  }
  else
    calcWindow.style.width=lastCalcWindowWidth+"px"
  Render()
})
calcWindowDragArea.addEventListener("mouseleave",(e)=>{
  calcWindow.classList.remove("drag")
})
//#endregion

//#region Input listeners
if(logBox) logBox.addEventListener("mousedown",(e)=>{ setSelection() })

if(consoleForm && consoleInput) consoleForm.addEventListener("submit",(e)=>{
  randomPlaceholder()
  e.preventDefault()
  inputReceived(consoleInput.value)
  consoleInput.value=""
})
if(consoleInput) consoleInput.addEventListener("keydown",(e)=>{
  if(Object.keys(keys).includes(e.key)) keys[e.key]=true
})
if(consoleInput) consoleInput.addEventListener("keyup",(e)=>{
  if(Object.keys(keys).includes(e.key)) keys[e.key]=false
  inputReceived(consoleInput.value,false)
})
//#endregion

// welcome to hell
function inputReceived(msg:string,submit:boolean=true){
  
  // remove ghost figure from previous input
  tempRenderable=null
  
  msg=msg.replaceAll("alert","console.log")
  if(msg.length==0){
    if(submit){ // delete selected log if exists
      if(selectedHtmlNode){
        var ro=getRenderable(selectedHtmlNode.getAttribute("name")!)
        if(ro){
          ro.Delete()
        }else selectedHtmlNode.remove()
        setSelection()  
      }
    }
    else outputField.innerHTML=""
    return
  }


  // output is stored in these values
  var outRO:Renderable|null=null
  var outMsg:string=markup(msg) // if nothing else is found
  var outAns:string|null=null
  var originalMsgInput=msg
  var sliderValue:number|null=null
  var isExecutable=false

  // NOTE: there are two wolves inside our eq; one snores like honk mimimi and the other snores like honk shoo honk shoo
  var inputEqSides=msg.split("=")
  var leftHand=inputEqSides.length>1?inputEqSides[0]:null
  var rightHand=inputEqSides[inputEqSides.length-1]
  const rightHandReduced=balanceParentheses(rightHand.replaceAll(" ",""))

  //#region we must figure out what we're trying to define
  if(msg.startsWith("/")){ // intended as a script
    outMsg=msg.substring(1)
    isExecutable=true
    if(submit) eval(outMsg)
  }
  else if(rightHand.match(/(^|\d|\(|\s|[+\-*/])x/g) || leftHand && leftHand.match(/(^|\d|\(|\s|[+\-*/])x/g)){ // defining a function (only if x not in a word, T.rex is not a function)
    if(leftHand && !leftHand.match(/[()]/)) leftHand=leftHand+"(x)"
    else if(!leftHand) leftHand=firstFreeName(fgh)+"(x)"
    outMsg=leftHand
    outAns=rightHand
    var displayName=leftHand.substring(0,leftHand.indexOf("("))
    
    msg=cleanupFuncString(rightHand)
    if(msg.replaceAll(" ","").includes(displayName+"(")){ // circular definition
      outMsg="Circular definition: "+ leftHand+" = "+rightHand
    }
    else if(isValidEvalString(displayName+"=(x)=>{ return ("+msg+") }")){
      const graphFunc=evalOutput
      console.log(eval(displayName))
      if(isValidEvalString(displayName+"(0)",false))
        outRO=new Graph(displayName,null,graphFunc as Function,graphColors[renderables.length%graphColors.length])
      else{
        outMsg="Undefined: "+leftHand+" = "+rightHand
        outAns=null
      }
    }
  }
  else{
    if(rightHandReduced.startsWith("[[")){ // defining a matrix
      var name=leftHand?leftHand:firstFreeName(mno)

      var funcString=rightHandReduced.substring(2,rightHandReduced.indexOf("]"))
      var args1=funcString.split(/[;,]/)
      if(args1.length==1 && rightHandReduced.endsWith(")")){ // iterative notation, [[i+j]](2,2) --> [[0,1],[2,3]] etc
        var lengthString=rightHandReduced.substring(rightHandReduced.indexOf("(")+1).replace(")","").split(/[,;]/)
        funcString=cleanupFuncString(funcString)
        
        var nrows=parseInt(lengthString[0])
        var ncols=parseInt(lengthString[lengthString.length-1])
        eval(name+"=outRO")
        if(isValidEvalString("tempFunc=(i,j)=>"+funcString) && !isNaN(nrows) && !isNaN(ncols)){

          rightHand="["
          for(var i=0; i<nrows; i++){
            var row="["+eval("tempFunc("+i+",0)")
            for(var j=1; j<ncols; j++){
              row+=", "+eval("tempFunc("+i+","+j+")")
            }
            rightHand+=row+"], "
          }
          rightHand=rightHand.substring(0,rightHand.length-2)+"]"
        }
        var body:number[][]|null=isValidEvalString(rightHand)?evalOutput as number[][]:null
        if(body) outRO=new Matrix(name,null,body,nrows,ncols)
      }else{    // standard notation, ie [[1,2],[3,4]]
        var args=rightHand.split(/[,;]/)
        var body:number[][]|null=isValidEvalString(rightHand)?evalOutput as number[][]:null
        if(body){
          var isValidMatrix=true
          for(const row of body)
            if(row.length!=body[0].length){
              isValidMatrix=false
              break
            }
          if(isValidMatrix){
            var nrows=body.length
            var ncols=nrows>0?body[0].length:0
            outRO=new Matrix(name,null,body,nrows,ncols)
            eval(name+"=outRO")
          }
        }
      }
      outMsg=name
      outAns=rightHand
    }else{

      if(!leftHand) leftHand=firstFreeName(abc) // beyond this point we use ABC names :)
      if(rightHandReduced.startsWith("[")){ // defining a vector
        var name=submit?firstFreeName(abc):"temp"
        var args1=rightHandReduced.substring(1).replace("]","").split(/[;,]/)
        if(args1.length==1 && rightHandReduced.endsWith(")")){ // iterative notation, [i+1](4) --> [1,2,3,4] etc
          var length=parseInt(rightHandReduced.substring(rightHandReduced.indexOf("(")+1).replace(")",""))
          var funcString=cleanupFuncString(rightHandReduced.substring(1,rightHandReduced.indexOf("]")))
          var vecBody:number[]=[]
          if(isValidEvalString("tempFunc=(i)=>"+funcString) && !isNaN(length)){

            for(var i=0; i<length; i++)
              vecBody.push(eval("tempFunc("+i+")"))
            
          }
          outRO=new Vector(name,null,vecBody)
          eval(name+"=outRO")
          outMsg=leftHand
          outAns=outRO.toString()

        }else{
          var args=rightHand.split(/[,;]/)
          outRO=new Vector(name,null,[0,0],()=>{
            var body=[]
            for(var a of args)
              body.push(evalMath(a) as number);
            (outRO as Vector).cells=body
          })
          eval(name+"=outRO")
          outMsg=leftHand
          outAns=rightHand
        }
      }
      if(rightHandReduced.startsWith("(") && msg.match(/[;,]/)){ // defining a point
        var args=rightHand.split(/[,;]/)
        outRO=new Point(submit?firstFreeName(abc):"temp",null,0,0,"#000",()=>{
          outRO!.x=evalMath(args[0]) as number
          outRO!.y=evalMath(args[1]) as number
        })
        outMsg=leftHand
        outAns=rightHand
      }
      else{ // defining a variable or just doing arithmetic
        
        if(isValidEvalString(msg) && evalOutput && !evalOutput.toString().startsWith("function") && !evalOutput.toString().startsWith("(x)=>")){
          msg=beautifyMathString(msg)
          if(msg.includes("=")){
            var s=msg.split("=")
            outMsg=s[0]
            outAns=s[1]
            sliderValue=evalMath(outAns) as number
          }
          else{
            outMsg=msg
            outAns=evalOutput as string
          }
        }
      }
    }
  }
  //#endregion
  if(outAns) outAns=outAns.toString()
  if(outAns && outAns.length>50){
    outAns=outAns.substring(0,25)+" ... "+outAns.substring(outAns.length-25)
  }
  var htmlNode:any=outputField
  if(submit){
    if(selectedHtmlNode){
      selectedHtmlNode.innerHTML=outMsg
      selectedHtmlNode.setAttribute("value",originalMsgInput)
      htmlNode=selectedHtmlNode
    }
    else htmlNode=appendLog(outMsg,outAns,originalMsgInput,"",sliderValue,isExecutable)
    outputField.innerHTML=""
  }
  else outputField.innerHTML=outAns?"="+outAns:outMsg

  if(outRO){
    if(submit){
      addRenderable(outRO)
      outRO.htmlNode=htmlNode
      htmlNode.setAttribute("name",outRO.name)
    }
    else tempRenderable=outRO
  }else
  htmlNode.setAttribute("name","")
  if(submit) selectedHtmlNode=null
  Render()
}
function markup(msg:string){
  if(msg.startsWith("## "))
    return "<h3>"+msg.substring(3)+"</h3>"
  if(msg.startsWith("# "))
    return "<h2>"+msg.substring(2)+"</h2>"
  return msg
}
function firstFreeName(preferredNames:string|string[]){
  if(selectedHtmlNode) return selectedHtmlNode.getAttribute("name")!
  for(var i=0; i<preferredNames.length; i++)
    if(getRenderable(preferredNames[i])==null)return preferredNames[i]
    for(var i=1; i<100; i++)
      if(getRenderable("f_"+i)==null) return "f_"+i
  return "we screwed up"
}

function balanceParentheses(msg:string){ // doesnt balance cases like "x) * (y" since count is the same :(
  var parIn=msg.split("(").length
  var parOut=msg.split(")").length
  if(parIn>parOut)
    for(;parOut<parIn; parOut++) msg+=")"
  else if(parIn<parOut)
    for(;parIn<parOut; parIn++) msg="("+msg
    
  parIn=msg.split("[").length
  parOut=msg.split("]").length
  if(parIn>parOut)
    for(;parOut<parIn; parOut++) msg+="]"
  else if(parIn<parOut)
    for(;parIn<parOut; parIn++) msg="["+msg
  return msg
}
function clampedIndex(msg:string,q:string,pos:number=0){
  var pos=msg.indexOf(q,pos)
  if(pos<0)return msg.length
  return pos
}
function parseSyntax(msg:string,sqrt:string,mathsqrt:string){
  //console.log(msg+":"+ msg.replaceAll(sqrt,mathsqrt))
    var i=0
    while(i>=0 && i<msg.length-sqrt.length){
      i=msg.indexOf(sqrt,i)
      if(i<0) break
      if(msg[i+sqrt.length]!='('){
        var nextOperator=msg.length
        const breakChars="+-*/() "
        for(var j=0; j<breakChars.length; j++)
          nextOperator=Math.min(clampedIndex(msg,breakChars[j],i+1+sqrt.length),nextOperator)
        msg=msg.substring(0,i)+mathsqrt+"("+msg.substring(i+sqrt.length,nextOperator)+")"+msg.substring(nextOperator)
      }else{
        msg=msg.substring(0,i)+mathsqrt+msg.substring(i+sqrt.length)
      }
      i+=mathsqrt.length
    }
    return msg
  }
function prepareStringForEval(msg:string,applySynonyms=false){
  msg=msg.replaceAll("^","**").replaceAll(")(",")*(") //.replaceAll("&middot;","*").replaceAll("&nbsp;","")
  msg=msg.replace(";",",").replace(/([0-9)])\(/g,  "$1*(").split("#")[0] // ignore styling 
  if(applySynonyms)
  for(const q in synonyms)
    msg=parseSyntax(msg,q,synonyms[q])
  
  return balanceParentheses(msg)
}
var evalOutput:Function|string|number[][]=""
function isValidEvalString(evalString:string,applySynonyms=true) {
  try {
    evalOutput=eval(prepareStringForEval(evalString,applySynonyms));
    return true;
  } catch (error) {return false}
}
function evalMath(evalString:string):number|string{
  if(!evalString || evalString.length<1)return "undefined"
  evalString=prepareStringForEval(evalString)
  try{ return Math.round(eval(evalString)*10000000)/10000000
  }catch{return "undefined"}
}
function cleanupFuncString(msg:string){
  var funcString=prepareStringForEval(msg);

  if(funcString.includes("if")){
    var conditions=funcString.split("if")
    if(msg.replaceAll(" ","").includes("<x<")){

      var lessthan=conditions[1].split("<")
      if(lessthan.length==3){
        conditions[1]=lessthan[0]+"<"+lessthan[1]+" && "+lessthan[1]+"<"+lessthan[2]
      }
    }
    funcString="{if("+conditions[1]+"){return "+ conditions[0]+"}return NaN}"
  }
  return funcString
}
function beautifyMathString(msg:string){
  msg=balanceParentheses(msg)
  msg=msg.replaceAll("sinpi","sin pi").replaceAll("cospi","cos pi").replaceAll("sqrt","&radic;")
  const regex = /([-+*/^<>()|])/g;
  msg= msg.replace(regex, (match, operator) => {
  if (operator) {
    return ` ${operator} `;
  }
  return match;
  }).replaceAll("*","&middot;").replaceAll(",",", ").replaceAll(";",";&nbsp; ");
  msg = msg.replace(/(?<!\w)e(?!w)/g, '<em>e</em>');
  msg = msg.replace(/(?<![a-zA-Z])pi(?![a-zA-Z])/g, 'π');
  
  return msg
}

// new printing function
function appendLog(msgQ:string,msgAns:string|null=null,value:string="",name:string="",sliderValue:number|null=null,isExecutable:boolean=false):HTMLElement{
  var writeTo:HTMLElement|null=selectedHtmlNode
  if(writeTo){
    writeTo.querySelector("p.q")!.innerHTML=msgQ
    var ans=writeTo.querySelector("p.ans")
    if(ans && msgAns) ans.innerHTML="= "+msgAns
  }else{
    writeTo=document.createElement("li")
    writeTo.innerHTML="<p class='q'>"+msgQ+"</p>"
    if(msgAns){
      writeTo.innerHTML+="<p class='ans'>= "+msgAns+"</p>"
    }
    logBox.append(writeTo)
  }
  setLogProps(writeTo,sliderValue,isExecutable)

  writeTo.setAttribute("name",name)
  writeTo.setAttribute("value",value==""?msgQ:value)
  writeTo.addEventListener("click",(e)=>{
    e.preventDefault()
    name=writeTo!.getAttribute("name")!
    var ro=getRenderable(name)
    if(ro) setSelection(ro,!keys.Shift)
    else setSelection(writeTo,!keys.Shift)
  })
  selectedHtmlNode=null
  return writeTo
}
function setLogProps(htmlNode:HTMLElement, sliderValue:number|null=null,isExecutable:boolean=false){
  if(!htmlNode) throw "cannot set properties on null object"
  var ans=htmlNode.querySelector("p.ans")
  if(!ans && (sliderValue || sliderValue==0 || isExecutable)){
    ans=document.createElement("p")
    ans.classList.add("ans")
    htmlNode.append(ans)
  }
  var slider=htmlNode.querySelector("input")
  if(sliderValue || sliderValue==0){
    if(!slider){
      slider=document.createElement("input")
      htmlNode.append(slider)
      slider.type="range"
      slider.value="0"
      slider.min="-5"
      slider.max="5"
      slider.step="0.05"
      slider.value=sliderValue.toString()
      slider.oninput=(e)=>{
        //ans.innerHTML="= "+slider!.value
        //sliderFunction(slider.value)
        Render()
      }
    }
  }else if(slider) slider.remove()

  var btnExecute=htmlNode.querySelector("button")
  if(isExecutable){
    var q=htmlNode.querySelector("p.q")!
    var pid=uniqueId(q.innerHTML)
    if(!btnExecute){
      btnExecute=document.createElement("button")
      btnExecute.innerHTML="<img src='icons/execute.png'>"
      htmlNode.insertBefore(btnExecute,htmlNode.children[0])
    }
    btnExecute.onclick=(e)=>{
      eval(q.innerHTML)
      e.preventDefault()
      e.stopPropagation()
    }
  }else if(btnExecute) btnExecute.remove()
  console.log()
}

function uniqueId(msg:string) :number{
  let hash = 0;
  if (msg.length === 0) 
    return hash
  for (let i = 0; i < msg.length; i++) {
    const char = msg.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32-bit integer
  }
  return hash;
}

//#region random placeholder in console input field
var placeholders=[
  "sin(x)",
  "sin3pi",
  "nCk(5;3)",
  "cos3e",
  "exp(10",
  "fac(5",
  "a=2",
  "roots(f)",
  "extremums(f)",
  "normal(x;mu,sigma)",
  "(1,2)",
  "[2,3]",
];
function randomPlaceholder(){
consoleInput!.placeholder=placeholders[Math.floor(Math.random()*placeholders.length)];
}
randomPlaceholder();
//#endregion

//#region calculator values and functions

const pi=Math.PI
const e=Math.E

function log(n:number){ return Math.log10(n)
}
function ln(n:number){return Math.log(n)
}
function lg(n:number,base:number){return Math.log(n)/Math.log(base)
}
function nCk(n:number,k:number){fac(n)/(fac(n-k)*fac(k))
}
function fac(n:number){
  n=Math.floor(n)
  if(n<=0) return 1
  for(var i=n-1; i>0; i--) n*=i
  return n
}

function exp(x:number){return Math.exp(x)}

//#endregion