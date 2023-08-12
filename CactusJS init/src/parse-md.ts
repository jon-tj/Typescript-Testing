const commonFileExtensions = ['md','css','cs','txt','js','ts','html','json','compute','py']
const pyKeywords =["max","min","len","isinstance","print","float","str","int","and", "as", "assert", "async","open","save", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "if", "import", "in", "is", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield" ]
const pyValues = ["True","False", "None", "lambda", "global", "nonlocal"]
const csKeywords=["public", "private", "protected", "internal", "if","else", "for", "while", "do", "switch", "case", "default","break", "continue", "try", "catch","new"]
const csTypes=["bool", "byte", "char", "decimal", "double", "float", "int", "long","string", "uint", "ulong", "ushort", "void", "object",]
const allCsKeywords = ["add",
"and",
"alias",
"ascending",
"args",
"async",
"await",
"by",
"descending",
"dynamic",
"equals",
"file",
"from",
"get",
"global",
"group",
"init",
"into",
"join",
"let",
"nameof",
"nint",
"not",
"notnull",
"nuint",
"on",
"or",
"orderby",
"partial (type)",
"partial (method)",
"record",
"remove",
"required",
"scoped",
"select",
"set",
"unmanaged (function pointer calling convention)",
"unmanaged (generic type constraint)",
"value",
"var",
"when (filter condition)",
"where (generic type constraint)",
"where (query clause)",
"with",
"yield",
"abstract",
"as",
"base",
"bool",
"break",
"byte",
"case",
"catch",
"char",
"checked",
"class",
"const",
"continue",
"decimal",
"default",
"delegate",
"do",
"double",
"else",
"enum",
"event",
"explicit",
"extern",
"false",
"finally",
"fixed",
"float",
"for",
"foreach",
"goto",
"if",
"implicit",
"in",
"int",
"interface",
"internal",
"is",
"lock",
"long",
"namespace",
"new",
"null",
"object",
"operator",
"out",
"override",
"params",
"private",
"protected",
"public",
"readonly",
"ref",
"return",
"sbyte",
"sealed",
"short",
"sizeof",
"stackalloc",
"static",
"string",
"struct",
"switch",
"this",
"throw",
"true",
"try",
"typeof",
"uint",
"ulong",
"unchecked",
"unsafe",
"ushort",
"using",
"virtual",
"void",
"volatile",
"while"]
// helper function for formatting
function insert(text:string,i:number,delCount:number,str:string){
    return text.substring(0,i)+str+text.substring(i+delCount)
}
function parseCombined(text:string,lang:string|null=null):string{
    if(!lang) lang = getLang(text)
    console.log("interpreted as "+lang)
    if(lang=='md'){
        //code snippets
        var codeSnippets=[{start:0,end:0}]
        var i=0
        while(i>=0){
            i=text.indexOf("```",i)
            var i1=text.indexOf("```",i+3)
            if(i<0) break
            if(i1<0) i1=text.length
            var innerText=text.substring(i+3,i1)
            var insertion=parseCode(innerText)
            text=insert(text,i,i1-i+3,insertion)
            codeSnippets.push({start:i,end:i+insertion.length})
            i=i1+insert.length
            if(i>=text.length-1) break
        }
        //parse the text between code snippets as md
        codeSnippets.push({start:text.length, end:text.length})
        for(var i=codeSnippets.length-1;i>=1;i--){
            var start=codeSnippets[i-1].end
            var end=codeSnippets[i].start
            var innerText=text.substring(start,end)
            var insertion=parseMd(innerText)
            text=insert(text,start,end-start,insertion)
        }
        return text
    }
    else return parseCode(text,lang)
}
const _q="\u0091" // signifies text formatting, is ignored in rendering
const sectionCodeStart="\u0091C1"
const sectionCodeEnd="\u0091C2"
function printFormat(italic:boolean=false,bold:boolean=false,underline:boolean=false,strikeThrough:boolean=false){
    return _q+"f"+(italic?"i":".")+(bold?"b":".")+(underline?"u":".")+(strikeThrough?"s":".")
}
/// use 6 digit hex colors!
function printColor(color:string="d2d2d2"){ return _q+"c"+color}
function hyperlink(text:string,url:string){
    return _q+"a"+url+_q+"a"+text+_q+"a"
}
function move_y(y:number){ return _q+"y"+y+_q}
function move_x(x:number){ return _q+"x"+x+_q}
function draw_line(dx:number,dy:number,w:number,h:number){ return _q+"l"+dx+","+dy+","+w+","+h+_q}
const verticalPadding=_q+"\n"
const horizontalPadding=_q+"\t"
const normalSize=_q+"1"
const header2=_q+"2"
const header1=_q+"3"
const noformat=printFormat()
const nocol=printColor()
const fontMath=_q+"Fmath"
const fontNormal=_q+"Fnorm"

const c_comment=printColor("6272a4")
const c_warning=printColor("db441e")
const c_question=printColor("20aabd")
const c_highlighted=printColor("5882ff")
const c_number=printColor("50e678")
const c_self=printColor("bd93fa")
const c_keyword=printColor("ff78be")
const c_function=printColor("ffed4b")
const c_property=printColor("8cdcfa")
const c_operator=printColor("c8a04b")
const c_string=printColor("e29272")

function parseMd(text:string):string{

    //math
    var i=0
    while(i>=0){
        i=text.indexOf("$",i)
        var i1=text.indexOf("$",i+1)
        if(i<0) break
        if(i1<0) i1=text.length
        var innerText=text.substring(i+1,i1)
        var insertion=fontMath+parseMath(innerText)+fontNormal
        text=insert(text,i,i1-i+1,insertion)
        i=i1+insert.length
        if(i>=text.length-1) break
    }

    // md language
    function wrap(findIn='# ',findOut='\n',replaceIn='<h1>',replaceOut='</h1>'){
        var i=0
        while(i>=0){
            i=text.indexOf(findIn,i)
            var i1=text.indexOf(findOut,i+findIn.length)
            if(i<0) break
            if(i1<0) i1=text.length
            text=insert(text,i1,findOut.length,replaceOut)
            text=insert(text,i,findIn.length,replaceIn)
            i=i1+1+replaceIn.length-findIn.length+replaceOut.length-findOut.length
            if(i>=text.length-1) break
        }
    }
    wrap('# ','\n',header1,normalSize+"\n")
    wrap('## ','\n',header2,normalSize+"\n")
    wrap('***','***',printFormat(true,true),noformat)
    wrap('**','**',printFormat(false,true),noformat)
    wrap('*','*',printFormat(true),noformat)
    wrap('_','_',printFormat(false,false,true),noformat)
    wrap('--','--',printFormat(false,false,false,true),noformat)
    wrap('!!','!!',c_warning,nocol)
    wrap('??','??',c_question,nocol)
    wrap('`','`',c_number,nocol)

    //links
    var i=0
    while(i>=0){
        i=text.indexOf("[",i)
        var i1=text.indexOf("]",i)
        if(i<0) break
        if(i1<0) i1=text.length
        var innerText=text.substring(i+1,i1)
        var s=innerText.split("|")
        var url=s[0]
        var surl:string[]|string=url.split("/") //this avoids pesky ../ urls being mistaken for file extensions
        surl=surl[surl.length-1]
        var extension:string[]|string|null=surl.split(".")
        if(extension.length>0) extension=extension[extension.length-1]
        else extension=null
        if(!(url.startsWith("http://") || url.startsWith("https://")) && !commonFileExtensions.includes(extension as string))
            url="http://"+url
        var name=s[s.length-1]
        var insertion=hyperlink(name,url)
        text=insert(text,i,i1-i+1,insertion)
        i=i1-1+insertion.length
        if(i>=text.length-1) break
    }
    //@ts-ignore
    text=text.replaceAll('\n- ','\n'+_q+'*')
    return text
}
function parseMath(text:string):string{
    var prevC=null
    // parse LaTeX structures like: \overline x=\tfrac{1}{N}\sum_{i=1}^Nx_i
    for(var i=0;i<text.length-1;i++){
        var c=text[i]
        var next=text[i+1]
        var skipChars=1
        if(next=="{"){
            next=parseMath(text.substring(i+2,text.indexOf("}",i+1))) // works only for 1 level :((
                skipChars+=2
        }
        if(c=='_'){ //sub
            var insertion=move_y(5)+next+move_y(-5)
            if(prevC=='^') insertion=move_x(-15)+insertion
            text=insert(text,i,next.length+skipChars,insertion)
            i+=insertion.length-next.length-skipChars+1
        }
        
        if(c=='^'){ //power
            var insertion=move_y(-5)+next+move_y(5)
            if(prevC=='_') insertion=move_x(-15)+insertion
            text=insert(text,i,next.length+skipChars,insertion)
            i+=insertion.length-next.length-skipChars+1
        }
        if(c=='\\'){
            var cmd=text.substring(i+1)
            if(cmd.startsWith('frac') || cmd.startsWith('tfrac')){
                var p1=cmd.indexOf('{')
                var p2=cmd.indexOf('}',p1+1)
                var q1=p2+1
                var q2=cmd.indexOf('}',q1+1)
                var p=parseMath(cmd.substring(p1+1,p2)), q=parseMath(cmd.substring(q1+1,q2))
                var pw=getStringWidth(p), qw=getStringWidth(q)
                var dw=Math.floor(Math.abs(pw-qw)/2)
                if(pw>qw)var insertion=move_x(3)+move_y(-7)+p+move_y(14)+move_x(dw-pw)
                else     var insertion=move_x(3+dw)+move_y(-7)+p+move_y(14)+move_x(-pw-dw)
                var fracW=Math.max(pw,qw)
                insertion+=q+move_y(-7)+move_x((pw>qw?dw:0))+draw_line(-fracW,-5,fracW,0)
                text=insert(text,i,q2-p1+7,insertion)
                i+=insertion.length-q2-p1+5
            }
            else if(cmd.startsWith("alpha"))text=insert(text,i,6,"α")
            else if(cmd.startsWith("beta"))text=insert(text,i,5,"β")
            else if(cmd.startsWith("gamma"))text=insert(text,i,6,"γ")
            else if(cmd.startsWith("delta"))text=insert(text,i,6,"δ")
            else if(cmd.startsWith("epsilon"))text=insert(text,i,8,"ε")

            else if(cmd.startsWith("intersect"))text=insert(text,i,10,"∩")
            else if(cmd.startsWith("int"))text=insert(text,i,4,"∫")
            else if(cmd.startsWith("in"))text=insert(text,i,3,"∈")
            else if(cmd.startsWith("cdot"))text=insert(text,i,5,"·")
            else if(cmd.startsWith("sum"))text=insert(text,i,4,"∑ ")
            else if(cmd.startsWith("prod"))text=insert(text,i,5,"∏ ")
            else if(cmd.startsWith("sqrt"))text=insert(text,i,5,"√")
            else if(cmd.startsWith("nabla"))text=insert(text,i,6,"∇")
            else if(cmd.startsWith("union"))text=insert(text,i,6,"∪")
            else if(cmd.startsWith("notin"))text=insert(text,i,3,"∉")
            else if(cmd.startsWith("forall"))text=insert(text,i,7,"∀")
            else if(cmd.startsWith("partial"))text=insert(text,i,8,"∂")
            else if(cmd.startsWith("uparrow"))text=insert(text,i,8,"↑")
            else if(cmd.startsWith("downarrow"))text=insert(text,i,10,"↓")
            else if(cmd.startsWith("leftarrow"))text=insert(text,i,10,"←")
            else if(cmd.startsWith("rightarrow"))text=insert(text,i,11,"→")
        }
        prevC=c
    }
    return text
}
function parseCode(text:string,lang:string|null=null){
    if(!lang) lang=getLang(text)
    if(['txt','md'].includes(lang)) return text
    var lines=text.split('\n')
    var self="self"
    var commentSymbol="#"
    var operators="+-*/%&|^~<>=!?"
    var parentheses="(){}[]:;"
    if(lang!='py'){
        self="this"
        commentSymbol="//"
    }
    if(lang=='html') parentheses+="<>"
    if(lines.length>1) text=text.substring(text.indexOf('\n')+1)

    var stringChars=["'",'"','`']
    var char_breakOutOfString:string|null=null
    var numberStyle:string|null=null
    var keywordFitsHere=true
    var keywords=[]
    if(lang=='py') keywords=pyKeywords

    for(var i=0;i<text.length;i++){
        var s=text.substring(i)
        var tempKwFitsHere=keywordFitsHere
        keywordFitsHere=" +-*/(){}[]!?'\"".indexOf(s[0])>=0
        if(char_breakOutOfString){ //strings should not change formatting
            if(s.startsWith(char_breakOutOfString)){
                text=insert(text,i+char_breakOutOfString.length,0,nocol)
                i+=nocol.length
                char_breakOutOfString=null
            }
            continue
        }
        if(s.startsWith(commentSymbol)){
            var col=c_comment
            if(s.length>0){
                if(s[commentSymbol.length]=="!") col=c_warning
                if(s[commentSymbol.length]=="?") col=c_question
                if(s[commentSymbol.length]=="*") col=c_highlighted
            }
            var i1=s.indexOf("\n",1)
            if(i1<0)i1=s.length
            var skipIntoComment=Math.min(2,i1-1)
            var insertion=col+s.substring(0,skipIntoComment)+parseMd(s.substring(skipIntoComment,i1))+nocol
            text=insert(text,i,i1,insertion)
            i+=insertion.length

            continue
        }
        var foundString=false
        for(var j=0;j<stringChars.length;j++){
            if(s.startsWith(stringChars[j])){
                char_breakOutOfString=stringChars[j]
                text=insert(text,i,0,c_string)
                i+=nocol.length
                foundString=true
                break
            }
        }
        if(foundString) continue
        if(s[0].match(/[0-9]/)){
            if(!numberStyle){
                numberStyle='normal'
                text=insert(text,i,0,c_number)
                i+=nocol.length
            }
            continue
        }
        if(numberStyle){
            if(numberStyle=='normal'){
                if('eE'.indexOf(s[0])>=0){
                    numberStyle='scientific'
                    continue
                }
                if(!s[0].match(/[0-9fFdD.]/)){
                    numberStyle=null
                    text=insert(text,i,0,nocol)
                    i+=nocol.length-1
                }
            }else if(numberStyle=='scientific'){
                if('+-'.indexOf(s[0])>=0) numberStyle='normal'
                else{
                    numberStyle=null
                    text=insert(text,i,0,nocol)
                    i+=nocol.length-1
                }
            }
            continue
        }
        var attrEnd= attributeEndIdx(text,i+1)
        if(s[0]=='.'){
            var col=(s.length>attrEnd-i && s[attrEnd-i]=='(')?c_function:c_property
            var insertion=col+s.substring(1,attrEnd-i-1)+nocol
            text=insert(text,i+1,attrEnd-i-2,insertion)
            i+=insertion.length
            continue
        }
        if(s.startsWith(self)){
            text=insert(text,i,self.length,printFormat(true)+c_self+self+noformat+nocol)
            i+=nocol.length*2+noformat.length*2+self.length-1
            continue
        }
        if(parentheses.indexOf(s[0])>=0){
            text=insert(text,i,1,c_self+s.substring(0,1)+nocol)
            i+=nocol.length*2
            continue
        }
        if(operators.indexOf(s[0])>=0){
            text=insert(text,i,1,c_operator+s.substring(0,1)+nocol)
            i+=nocol.length*2
            continue
        }
        if(tempKwFitsHere)
        for(var j=0;j<keywords.length;j++){
            if(s.startsWith(keywords[j]))
            {
                text=insert(text,i,keywords[j].length,c_keyword+keywords[j]+nocol)
                i+=keywords[j].length+nocol.length*2-1
                continue
            }
        }
    }
    return nocol+noformat+verticalPadding+sectionCodeStart+text+sectionCodeEnd
}

// finds the language of the text to be parsed
function getLang(text=""){
    if(text.includes("```")) return "md" //this would otherwise throw us off 

    // check first line for language tag
    var lines=text.split('\n')
    //@ts-ignore replaceAll
    var firstLine=lines[0].replaceAll("#","").replace("//","") // allow tags to be commented out in code
    for(var i=0;i<commonFileExtensions.length;i++)
        if(firstLine.startsWith(commonFileExtensions[i])) return commonFileExtensions[i]
    
    // maybe we're lucky and the start contains enough information ;)
    var start=""
    for(var i=0;i<lines.length;i++){
        if(lines[i].startsWith("#") || lines[i].startsWith("//")) continue
        start+=lines[i]+"\n"
        if(start.length>90)break
    }
    if(start.includes('using') || start.includes('public')) return 'cs'
    if(start.includes('"""')) return 'py'
    var ts=(text.split(':number').length*4+text.split(':').length+text.split('|null').length-6)/lines.length
    if(start.includes('function') || start.includes('class ') || start.includes('const ') || start.includes('let ')){
        if(ts>0.1) return 'ts'
        else return 'js'
    }

    // start is bland, we need to check a larger chunk of code
    //(last 2000 chars to hopefully avoid useless comments)
    if(text.length>2000) text=text.substring(text.length-2000)
    var lineLength=text.length/lines.length // long lines means md
    var endSemicolon=0 // high ';' means css or cs usually (could also be js)
    var endBracket=0 // high '>' means html
    for(var i=0;i<lines.length;i++){
        if(lines[i].length<1)continue
        if(lines[i].endsWith(';')) endSemicolon++
        if(lines[i].endsWith('>')) endBracket++
    }
    endSemicolon/=lines.length
    endBracket/=lines.length
    if(lineLength>65) return 'md'
    if(endBracket>0.8) return 'html'
    if(endSemicolon>0.4){
        // check if css or cs: ~ 0.23 for css, ~ 0.6 for cs --> threshold around 0.5
        var cs=(text.split('.').length+text.split('=').length-2)/lines.length
        if(cs>0.5) return 'cs'
        else return 'css'
    }
    if(text[0]!=text[0].toUpperCase()) return "py" // short lines but few semicolons usually means py
    return 'md' //we dont really know, fallback to md
}
// used to discriminate between py and md
function words(text: string): number {
    const words = text.split(/\s+/).filter(word => /^[A-Za-z]+$/.test(word));
    return words.length;
}
// used in code formatting
function attributeEndIdx(str: string, i: number): number {
    const regex = /[^a-zA-Z0-9_]/;
    const match = str.slice(i).match(regex);

    if (match) {
        return i + match.index + 1;
    }

    return -1; // No non-alphanumeric character found after index i
}