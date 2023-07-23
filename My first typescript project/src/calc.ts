
/// <reference path="index.ts"/> 
interface VariableLookup{[key:string]:number}
interface FunctionLookup{[key:string]:string}


// Declare JS objects
let variables={'e':Math.E,'pi':Math.PI} as VariableLookup
let functions={
  'exp1':"e^§1",
  "lg2":"Math.log(§1)/Math.log(§2)",
  "lg1":"Math.log(§1)",
  "nCk2":"fac§1/(fac(§1-§2)*fac(§2))",
  "mag1":"Math.sqrt(§1.x**2+§1.y**2)",
  "mg1":"(§1+1)",
} as FunctionLookup
let synonyms={
  "Mathf":"Math",
  "math":"Math",
  "Math.Clamp":"clamp",
  
  "asinh":"Math.asinh",
  "acosh":"Math.acosh",
  "atanh":"Math.atanh",

  "asin":"Math.asin",
  "acos":"Math.acos",
  "atan":"Math.atan",

  "sinh":"Math.sinh",
  "cosh":"Math.cosh",
  "tanh":"Math.tanh",

  "sin":"Math.sin",
  "cos":"Math.cos",
  "tan":"Math.tan",
} as FunctionLookup
let selectedLogIdx=-1

// Select HTML objects
const logBox=document.querySelector<HTMLUListElement>("#log-box")
const consoleForm=document.querySelector<HTMLInputElement>("#console-form")
const consoleInput=document.querySelector<HTMLInputElement>("#console-input")
const outputField=document.querySelector<HTMLParagraphElement>("#output-field")

consoleInput!.focus()
if(logBox) logBox.addEventListener("mousedown",(e)=>{
    //e.preventDefault()
    if(selectedLogIdx>=0){
        if(consoleInput){
            consoleInput.focus()
            consoleInput.value=""
        }
        logBox.children[selectedLogIdx].classList.remove("selected")
        selectedLogIdx=-1
    }
})

//#region Calc window listeners
// Drag calc window or double click to hide/show
const calcWindow=document.querySelector<HTMLDivElement>("#calc-window")!
const calcWindowDragArea=document.querySelector<HTMLDivElement>("#calc-window-drag-area")!
calcWindowDragArea.addEventListener("mousemove",(e)=>{
  e.preventDefault()
  if(e.buttons==1 && dragCalcWindow){
    calcWindow.style.width=e.x+"px"
    calcWindowDragArea.style.left="calc(100% - 8em)"
    calcWindowDragArea.style.right="-8em"
  }else{
    dragCalcWindow=false
    calcWindowDragArea.style.left="calc(100% - 1em)"
    calcWindowDragArea.style.right="-1em"
  }
  calcWindow.style.borderRight="3px solid orange"
  GraphViewRender(canvas,ctx!)
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
  GraphViewRender(canvas,ctx!)
})
calcWindowDragArea.addEventListener("mouseleave",(e)=>{
    calcWindow.style.borderRight="3px solid white"
})
//#endregion


if(consoleForm && consoleInput) consoleForm.addEventListener("submit",(e)=>{
  randomPlaceholder()
  e.preventDefault()
  inputReceived(consoleInput.value)
  consoleInput.value=""
})
if(consoleInput) consoleInput.addEventListener("keyup",(e)=>{
  inputReceived(consoleInput.value,false)
  if(e.key=="Delete"){
    if(selectedLogIdx>=0 && selectedLogIdx<logBox!.childElementCount){
        var name=logBox!.children[selectedLogIdx].getAttribute("name")
        if(name){
          console.log(name)
          deleteInLog(name)
        }
        logBox!.removeChild(logBox!.children[selectedLogIdx])
        selectedLogIdx=-1
        consoleInput.value=""
        outputField!.innerHTML=""
    }
  }
})
function tryEval(evalString:string) {
  try {
    eval(evalString);
    return true;
  } catch (error) {return false;}
}
function inputReceived(msg:string,printLog:boolean=true){
  vectors['_temporary_']=null
  points['_temporary_']=null
  graphs['_temporary_']=null
  var msgOriginal=msg

  if((msg.startsWith("roots") || msg.startsWith("extremum")) && msg.match(/[ (]/)){
    var tf=cleanupFuncString(msg.substring(msg.search(/[ (]/)))
    if(tryEval("tempFunc=(x)=>{ return ("+tf+")}")){
      if(typeof(eval("tempFunc(0)"))!=="number") // user has written something like "roots f", without the (x)
        tryEval("tempFunc="+tf+"")
      if(msg.startsWith("extremum"))
        var root=eval("NewtonsGrid( derivateNaive(tempFunc))")
      else var root=eval("NewtonsGrid( tempFunc)")
      msg=mathString(msg)
      
      if(printLog){
        var roots=root.split(",")
        for(var r in roots){
          points['r'+r]={x:parseFloat(roots[r]),y:eval("tempFunc(roots[r])"),update:false}
        }
      }
      msg+= "<br>="+root
    }
    print(msg,msgOriginal,printLog)
    return
  }
  if(msg.startsWith("der")){
    var displayName=getDisplayName()
    deleteInLog("g"+displayName)
    msg=msg.substring(msg.search(/[ (]/))
    if(printLog){
      var tf=cleanupFuncString(msg)
      if(tryEval(displayName+"=derivateNaive((x)=>{ return ("+tf+")})")){
        var v=eval(displayName+"(0)")
        if(typeof(v)!=="number" || v.toString()=="NaN") // user has written something like "roots f", without the (x)
          tryEval(displayName+"=derivateNaive("+tf+")")
      }
      eval("graphs[displayName]="+displayName)
    }
    print("<span class='large'>&int;</span>"+displayName+ "(x)dx <br><strong>:</strong>= "+msg,msgOriginal,printLog,displayName)
    return
  }

  if(msg.startsWith("int")){
    var displayName=getDisplayName()
    msg=msg.substring(msg.search(/[ (]/))
    if(printLog){
      var tf=cleanupFuncString(msg)
      if(tryEval("tempFunc=derivateNaive((x)=>{ return ("+tf+")})")){
        var v=eval("tempFunc(0)")
        if(typeof(v)!=="number" || v.toString()=="NaN") // user has written something like "roots f", without the (x)
          tryEval("tempFunc=derivateNaive("+tf+")")
      }
      eval("graphs[displayName]=tempFunc")
    }
    print("<span class='large'>&int;</span>"+displayName+ "(x)dx <br><strong>:</strong>= "+msg,msgOriginal,printLog)
    return
  }

  GraphViewRender(canvas,ctx!)
  msg=balanceParentheses(msg)
  var msgNoWhitespace=msg.replaceAll(" ","")
  if(msg[0]=="/"){
    //This is a direct command, we just eval
    
    if(printLog){
      var func=eval("tempFunc=()=>{return ("+msg.substring(1)+")}")
      var output=eval("tempFunc()")
      if(output)
        print(msg.substring(1)+"<br>="+output.toString().replaceAll(/,(\d+)/g,", $1"),msg,printLog,"",NaN,()=>0,func,msg.substring(1)+"<br>=")
      else print(msg.substring(1),msg,printLog,"",NaN,()=>0,func,msg.substring(1)+"<br>=")
      GraphViewRender(canvas,ctx!)
    }else
      print(msg.substring(1),msg,printLog)
    return
  }
  if(msg.length==0){
    if(printLog)return
    else print("","",false)
    return
  }
  var msgSplit=msgNoWhitespace.split("=")
  var definitionString=balanceParentheses(msgSplit[msgSplit.length-1])
  var displayName=""
  if(msgSplit.length>1) displayName=msgSplit[0]
  if(definitionString[0]=="(" && definitionString.match(/[;,]/)){ // point
    
    if(displayName==""){

      for(var i=Object.keys(vectors).length; i<1000; i++)
        if(!points["p"+i])break
      displayName="p"+i
    }
    var args1=definitionString.substring(1).split(/[;,]/)
    if(printLog){
      var updateFunc="false"
      if(lookupVariables(args1[0]).includes("variables") || lookupVariables(args1[1]).includes("variables")){
        eval("update_"+displayName+"=()=>{points[displayName].x=myEvalFunc(args1[0]);points[displayName].y=myEvalFunc(args1[1])}")
        updateFunc="update_"+displayName
      }
      eval("points[displayName]={x:myEvalFunc(args1[0]),y:myEvalFunc(args1[1]),x0:0,y0:0,update:"+updateFunc+"}")
    }else{
      if(selectedLogIdx>=0){
        deleteInLog(logBox!.children[selectedLogIdx].getAttribute("name")!)
      }
      tryEval("points['_temporary_']={x:"+myEvalFunc(args1[0])+",y:"+myEvalFunc(args1[1])+",update:false}")
    }
    print(mathString(displayName+"="+definitionString),displayName+"="+msg,printLog,"p"+displayName)
    GraphViewRender(canvas,ctx!,!printLog)
    return
  
  }


  
  if(definitionString.startsWith("[[")){ // matrix
    if(displayName==""){

      for(var i=Object.keys(vectors).length; i<1000; i++)
        if(!vectors["m"+i])break
      displayName="m"+i
    }
    var args1=definitionString.substring(2,definitionString.indexOf("]")).split(/[;,]/)
    if(args1.length==1 && definitionString.endsWith(")")){ // iterative notation, [[i+j]](2,2) --> [[0,1],[2,3]] etc
      var lengthString=definitionString.substring(definitionString.indexOf("(")+1).replace(")","").split(/[,;]/)
      var rows=parseInt(lengthString[0])
      var columns=parseInt(lengthString[1])
      var funcString=cleanupFuncString(definitionString.substring(2,definitionString.indexOf("]")))
      if(tryEval("tempFunc=(i,j)=>"+funcString) && !isNaN(rows) && !isNaN(columns)){

        definitionString="["
        for(var i=0; i<rows; i++){
          var row="["+eval("tempFunc("+i+",0)")
          for(var j=1; j<columns; j++){
            row+=", "+eval("tempFunc("+i+","+j+")")
          }
          definitionString+=row+"], "
        }
        definitionString=definitionString.substring(0,definitionString.length-2)+"]"
      }
    }else{
      try{

        var obj=eval(definitionString) as number[][]
        var rows=obj.length
        var columns=obj[0].length
      }catch{
        print("?",msg,printLog)
        return
      }
    }
    
    if(printLog){
      var updateFunc="false"
      if(lookupVariables(definitionString).includes("variables")){
        eval("update_"+displayName+"=()=>{matrices[displayName].iter((i,j)=>("+definitionString+"))}")
        updateFunc="update_"+displayName
      }
      eval("matrices[displayName]=new Matrix("+definitionString+",rows,columns)")
      GraphViewRender(canvas,ctx!)
    }else{
      if(selectedLogIdx>=0){
        deleteInLog(logBox!.children[selectedLogIdx].getAttribute("name")!)
      }
      tryEval("matrices['_temporary_']=new Matrix("+definitionString+",rows,columns)")
      GraphViewRender(canvas,ctx!,true)
    }
    print(mathString(displayName+"="+definitionString),displayName+"="+msg,printLog,"M"+displayName)
    return
  }


  if(definitionString[0]=="["){ // vector
    if(displayName==""){

      for(var i=Object.keys(vectors).length; i<1000; i++)
        if(!vectors["v"+i])break
      displayName="v"+i
    }
    var args1=definitionString.substring(1).replace("]","").split(/[;,]/)
    if(args1.length==1 && definitionString.endsWith(")")){ // iterative notation, [i+1](4) --> [1,2,3,4] etc
      var length=parseInt(definitionString.substring(definitionString.indexOf("(")+1).replace(")",""))
      var funcString=cleanupFuncString(definitionString.substring(1,definitionString.indexOf("]")))
      if(tryEval("tempFunc=(i)=>"+funcString) && !isNaN(length)){

        definitionString="["+eval("tempFunc(0)")
        for(var i=1; i<length; i++)
         definitionString+=", "+eval("tempFunc("+i+")")
        definitionString+="]"
      }
      args1=definitionString.substring(1).replace("]","").split(/[;,]/)
      
    }
    if(printLog){
      var updateFunc="false"
      if(lookupVariables(args1[0]).includes("variables") || lookupVariables(args1[1]).includes("variables")){
        eval("update_"+displayName+"=()=>{vectors[displayName].x=myEvalFunc(args1[0]);vectors[displayName].y=myEvalFunc(args1[1])}")
        updateFunc="update_"+displayName
      }
      eval("vectors[displayName]={x:myEvalFunc(args1[0]),y:myEvalFunc(args1[1]),x0:0,y0:0,update:"+updateFunc+"}")
      GraphViewRender(canvas,ctx!)
    }else{
      if(selectedLogIdx>=0){
        deleteInLog(logBox!.children[selectedLogIdx].getAttribute("name")!)
      }
      if(args1.length>1)
      tryEval("vectors['_temporary_']={x:"+myEvalFunc(args1[0])+",y:"+myEvalFunc(args1[1])+",x0:0,y0:0,update:false}")
      GraphViewRender(canvas,ctx!,true)
    }
    print(mathString(displayName+"="+definitionString),displayName+"="+msg,printLog,"V"+displayName)
    return
  }


  if((msg.includes("=") && !msg.includes("==")) || msg.includes("x")){ //define variable or function
    if(!msg.includes("=")){
      displayName=getDisplayName()
      msg=displayName+"(x)="+msg
    }
    msg=msg.replace(/(\d+)(pi|e)/gi, '($1*$2)');
    var s=msg.split("=")
    if(["sqrt","sin","cos","pi","e","i","roots","extremum","int"].includes(s[0])){
        print("Error: illegal override: "+s[0]+"#red",msg,printLog)
      return
    }
    if(s[0].includes("(")){ //defining a FUNCTION
      
      var argsString=s[0].split("(")[1]
      argsString=argsString.substring(0,clampedIndex(argsString,")",0))
      var args=argsString.replace(" ","").split(/[;,]/)
      var displayName=s[0].split("(")[0]
      var funcString=cleanupFuncString(s[1])

      deleteInLog("g"+displayName)
      print(mathString(s[0])+"<br><strong>:</strong>= "+mathString(s[1]),msg,printLog,"g"+displayName)
      if(printLog){
        eval(displayName+"=("+args+")=>"+funcString)
        eval("graphs['"+displayName+"']="+displayName)
        GraphViewRender(canvas,ctx!)
      }else{
        tryEval("graphs['_temporary_']=("+args+")=>"+funcString)
        GraphViewRender(canvas,ctx!,true)
      }
      console.log(funcString)
      return
    }else{ //defining a variable
      var res1=myEvalFunc(s[1].replaceAll("^","**"))
      if(res1!="undefined"){
        variables[s[0]]=res1
        print(mathString(s[0])+"<br><strong>:</strong>= "+mathString(s[1]),msg,printLog,"v"+s[0],parseFloat(s[1]),(value:string)=>variables[s[0]]=parseFloat(value.toString())) // TODO: merge these two lol
      }else  print(mathString(s[0])+"<br><strong>:</strong>= undefined",msg,printLog,"v"+s[0],parseFloat(s[1]),(value:string)=>variables[s[0]]=parseFloat(value.toString()))
      GraphViewRender(canvas,ctx!)
      return
    }
  }
  else if(!msg.includes("# ")) try{
    var msgEval=msg.replace(/(\d+)(pi|e)/gi, '($1*$2)');
    var res=myEvalFunc(msgEval)
    var s1=msg.split("#")
    var msgOut=s1[0]
    if(res!="undefined") msgOut=mathString(s1[0])+"<br>= "+res
    if(s1.length>1)msgOut+="#"+s1[1]
    print(msgOut,msg,printLog)
    GraphViewRender(canvas,ctx!)
    return
  }catch{}
  print(msg,msg,printLog)
  GraphViewRender(canvas,ctx!)
}
function getDisplayName(){
  var preferredFunctionNames="fghklmnopqrstuv"

  for(var i=0; i<preferredFunctionNames.length; i++){
    if(!graphs[preferredFunctionNames[i]])break
  }
  var displayName=preferredFunctionNames[i]
  if(!displayName){
    for(var i=1; i<100; i++)
      if(!graphs["f_"+i]){
        displayName="f_"+i
        break
      }
  }
  return displayName
}
function cleanupFuncString(msg:string){
  var funcString=lookupVariables(msg.replaceAll("^","**"))//.replaceAll(")(",")*(")
      
  const pattern = /([0-9)])\(/g;
  const replacement = "$1*(";

  funcString= funcString.replace(pattern, replacement);

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
function clampedIndex(msg:string,q:string,pos:number=0){
  var pos=msg.indexOf(q,pos)
  if(pos<0)return msg.length
  return pos
}
function myEvalFunc(msg:string):any{
  msg=lookupVariables(msg).replaceAll("^","**").replaceAll(")(",")*(")
  msg=msg.replace(";",",").split("#")[0] // ignore styling 
  function parseSyntax(sqrt:string,mathsqrt:string){
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
  }
  parseSyntax("sqrt","Math.sqrt") ; parseSyntax("sin","Math.sin") ; parseSyntax("cos","Math.cos") ; parseSyntax("fac","fac") 
  msg=balanceParentheses(msg)
  try{
    return Math.round(eval(msg)*10000000)/10000000
  }catch{return "undefined"}
}
function balanceParentheses(msg:string){
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

function lookupVariables(msg:string){
  msg=lookupFunctions(msg)
  var synIdx=0
  for(const v in synonyms){
    msg=msg.replaceAll(v,"§"+synIdx)
    synIdx++
  }
  synIdx=0
  for(const v in synonyms){
    msg=msg.replaceAll("§"+synIdx,synonyms[v])
    synIdx++
  }
  var sorted = Object.keys(variables).sort((a, b) => b.length - a.length)
  for(const v in sorted)
    msg=msg.replaceAll(sorted[v],"§§['"+sorted[v]+"']")
  return msg.replaceAll("§§","variables")
}

function lookupFunctions(msg:string){
  var sorted = Object.keys(functions).sort((a, b) => b.length - a.length)
  for(const v in sorted){
    var q=sorted[v].substring(0,sorted[v].length-1)
    msg=replaceFunctionMsg(msg,q,parseInt(sorted[v].substring(sorted[v].length-1)),functions[sorted[v]])
  }
  return msg
}
function replaceFunctionMsg(msg:string,q:string,numArgs:number,r:string){
  var i=0
  while(i<msg.length){
    i=msg.indexOf(q,i)
    if(i<0)break
    var fStart=i
    i+=q.length+1
    var argsStart=i
    i=msg.indexOf(")",i)
    if(i<0)i=msg.length
    var args=msg.substring(argsStart,i).split(/[;,]/)
    if(args.length==numArgs){
      for(var j=0; j<numArgs; j++)
        r=r.replaceAll("§"+(j+1),args[j])
      msg=msg.substring(0,fStart)+r+msg.substring(i+1)
      i+=r.length-(i-fStart)+1
    }
  }
  return msg
}

// whitespace between numbers and operators, and replaces * with dot
function mathString(msg:string){
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

// write to the log
function print(msg:string,msgOriginal:string,appendLog:boolean,name:string="",sliderValue:number=NaN,sliderFunction:Function=()=>0,executable:any=false,msgBeforeExecution:string=""){
  if(msg.length>70 && !executable){ // don't truncate code snippets >:(
    msg=msg.substring(0,30)+" ... "+msg.substring(msg.length-30)
  }
  var details=msg.split("#") // get styling
  if(msg.startsWith("## "))
    msg="<h3>"+details[2].substring(1)+"</h3>"
  else if(msg.startsWith("# "))
    msg="<h2>"+details[1].substring(1)+"</h2>"
  else msg=details[0]


  if(!logBox) return // angy >:(

  if(appendLog){
    function createSlider(q:any){
      var slider=document.createElement("input")
      slider.type="range"
      slider.min="-5"
      slider.max="5"
      slider.step="0.05"
      slider.value=sliderValue.toString()
      slider.oninput=(e)=>{
        q.children[0].innerHTML=msg.substring(0,msg.lastIndexOf("="))+"= "+slider.value
        sliderFunction(slider.value)
        GraphViewRender(canvas,ctx!)
      }
      q.append(slider)
    }
    function createCodeSnippet(q:any){
      var pid=generateCustomID(msg)
      q.innerHTML="<button><img src='icons/execute.png'></button><p id="+pid+">"+msg+"</p>"
      q.children[0].addEventListener("click",(e:any)=>{
        var output=executable()
        GraphViewRender(canvas,ctx!)
        if(output || output==false || output==0)
        document.getElementById(pid)!.innerHTML=msgBeforeExecution+output.toString().replaceAll(/,(\d+)/g,", $1")
      })
    }
    if(selectedLogIdx>=0){ // update selected item
      var q1=logBox!.children[selectedLogIdx]
      q1.innerHTML="<p>"+msg+"</p>"
      if(sliderValue || sliderValue==0) createSlider(q1)
        if(executable) createCodeSnippet(q1)
      
      q1.setAttribute("value",msgOriginal)
      q1.setAttribute("color","")
      if(name.length>0) q1.setAttribute("name",name)
      for(let i=1; i<details.length; i++) if(details[i].length>1 && details[i][0]!=" ")
        q1.setAttribute("color",details[i])
      logBox.children[selectedLogIdx].classList.remove("selected")
      selectedLogIdx=-1

    }else{ // create new item to hold the log
      var q = document.createElement("li")
      q.setAttribute("value",msgOriginal)
      q.setAttribute("color","")
      if(name.length>0) q.setAttribute("name",name)
      for(let i=1; i<details.length; i++) if(details[i].length>1 && details[i][0]!=" ")
      q.setAttribute("color",details[i])
      q.innerHTML="<p>"+msg+"</p>"
      logBox.append(q)
      logBox.scrollTop = logBox.scrollHeight; // scroll latest into view
      q.addEventListener("click",(e)=>{
        consoleInput!.value=q.getAttribute("value")!
        if(selectedLogIdx>=0)
          logBox.children[selectedLogIdx].classList.remove("selected")
        selectedLogIdx=Array.from(logBox!.children).indexOf(q)
        logBox.children[selectedLogIdx].classList.add("selected")
        consoleInput!.focus()
      })
      if(sliderValue || sliderValue==0)
        createSlider(q)
      else{
        if(executable) createCodeSnippet(q)
        else q.innerHTML="<p>"+msg+"</p>" // destroy slider if exists
      }
    }
  }else
    if(outputField) outputField.innerHTML=msg
}
function deleteInLog(name:string){
  if(name[0]=="g" && graphs[name.substring(1)]){
    delete graphs[name.substring(1)]
  }
  else if(name[0]=="v" && variables[name.substring(1)]){
    delete variables[name.substring(1)]
  }
  else if(name[0]=="V" && vectors[name.substring(1)]){
    delete vectors[name.substring(1)]
  }
  else if(name[0]=="p" && points[name.substring(1)]){
    delete points[name.substring(1)]
  }
  else if(name[0]=="M" && matrices[name.substring(1)]){
    delete matrices[name.substring(1)]
  }
  GraphViewRender(canvas,ctx!)
}
function generateCustomID(seed:string) {
  // simple hasher for unique IDs
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const charCode = seed.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
    hash &= hash; // Convert to 32-bit integer (optional, depending on your use case)
  }
  hash = Math.abs(hash);
  const customID = hash.toString(16);
  return customID;
}

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