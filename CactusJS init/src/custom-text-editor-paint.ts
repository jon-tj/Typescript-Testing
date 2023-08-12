
const imgs={}
var imgsLoaded=false
function loadImg(name){
    imgs[name]=new Image()
    imgs[name].src="../public/img/"+name+".png"
    imgsLoaded=false
    imgs[name].onload=function(){imgsLoaded=true; render()}
}
['play','copy'].forEach((img)=>loadImg(img))
var theme:any|null=null

function getThemeColors(){
    var styles=getComputedStyle(document.documentElement)
    theme={
        editor_bg:  styles.getPropertyValue('--editor-bg'),
        editor_pr:  styles.getPropertyValue('--editor-primary'),
        editor_t1:  styles.getPropertyValue('--editor-bg-light'),
        editor_t2:  styles.getPropertyValue('--editor-bg-dark'),
        outline:    styles.getPropertyValue('--editor-outline'),
        sidebar_bg: styles.getPropertyValue('--sidebar-bg'),
        navbar_bg:  styles.getPropertyValue('--navbar-bg'),
        navbar_pr:  styles.getPropertyValue('--navbar-primary'),
        navbar_sc:  styles.getPropertyValue('--navbar-secondary'),

        code_bg:        styles.getPropertyValue('--code-bg'),
        code_string:    styles.getPropertyValue('--string'),
        code_self:      styles.getPropertyValue('--self'),
        code_comment:   styles.getPropertyValue('--comment'),
        code_warning:   styles.getPropertyValue('--warning'),
        code_question:  styles.getPropertyValue('--question'),
        code_highlight: styles.getPropertyValue('--highlighted'),
        code_operator:  styles.getPropertyValue('--operator'),
        code_number:    styles.getPropertyValue('--number'),
        code_keyword:   styles.getPropertyValue('--keyword'),
        code_property:  styles.getPropertyValue('--property'),
        code_function:  styles.getPropertyValue('--function'),
    }
}
getThemeColors()

function render(){
    ctx.font="11pt Arial"
    //clear
    ctx.fillStyle=theme.editor_bg
    ctx.fillRect(0,0,canvas.width,canvas.height)

    //draw current page content
    var text=nocol+noformat+parseCombined(editor.activeTab.content)+"\n"

    var margin=30
    var lineHeight=20
    var charSize=8

    var underline=false, strikeThrough=false, isCode=false
    var isFraction=0
    var isHyperlink=0
    var hyperlinkVal=""
    var lineNumber=0
    var x=0, y=40-editor.activeTab.scrollY

    for(var i=0;i<text.length;i++){
        var currMargin=isCode?margin*2:margin
        var c=text[i]
        if(c=='\n'){
            if(isCode){
                ctx.fillStyle=theme.outline
                ctx.fillText((lineNumber+1).toString(),margin,y)
                ctx.fillStyle=theme.editor_pr
            }
            y+=lineHeight
            x=0
            lineNumber++
        }else{
            if(c==_q){ // formatting sequence
                switch(text[i+1]){
                    case "c": //color
                        ctx.strokeStyle="#"+text.substring(i+2,i+8)
                        ctx.fillStyle="#"+text.substring(i+2,i+8)
                        i+=7
                        break
                    case "f": //format/italic,bold,underline,strikethrough
                        var fontSize:string|string[]=ctx.font.split(' ')
                        fontSize=fontSize[fontSize.length-2]
                        ctx.font =
                            (text[i+2]=='.'?'':'italic ')+
                            (text[i+3]=='.'?'':'bold ')+
                            fontSize+" Arial"
                        underline=text[i+4]!='.'
                        strikeThrough=text[i+5]!='.'
                        i+=5
                        break
                    case "a": //hyperlink
                        if(isHyperlink==0){
                            isHyperlink=2
                            underline=true
                        }else{
                            isHyperlink--
                            if(isHyperlink==1){
                                hyperlinkVal="" // stores the actual url
                            }
                            if(isHyperlink==0){
                                underline=false
                            }
                        }
                        i+=1
                        break
                    case "\n"://vertical offset
                        y+=lineHeight
                        i+=1
                        break
                    case "\t"://horizontal offset
                        break
                    case "1": //normal size
                        ctx.font="11pt Arial"
                        charSize=8
                        y+=5
                        i++
                        break
                    case "2": //header2
                        ctx.font="bold 16pt Arial"
                        y+=24
                        charSize=12
                        i++
                        break
                    case "3": //header1
                        ctx.font="bold 20pt Arial"
                        y+=35
                        charSize=15
                        i++
                        break
                    case "C": // Code section starts/ends
                        if(text[i+2]=='1'){
                            lineNumber=0
                            isCode=true
                            if(imgsLoaded)
                            ctx.drawImage(imgs['play'],4,y-lineHeight)
                            ctx.drawImage(imgs['copy'],4,y+5)
                        }
                        else{
                            isCode=false
                        }
                        i+=2
                        break
                    case "*":
                        ctx.fillStyle=theme.outline
                        ctx.beginPath();
                        ctx.arc(margin+12, y-5, 3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.closePath();
                        x+=25
                        i++
                        ctx.fillStyle=theme.editor_pr
                        break
                    case ".":
                        ctx.beginPath();
                        ctx.arc(x+currMargin, y-5, 1, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.closePath();
                        i++
                        break
                    case "F":
                        var font=text.substring(i+2,i+6)
                        if(font=="math")
                            ctx.font="italic 11pt freeserif, \"times new roman\", serif"
                        else ctx.font="11pt Arial"
                        i+=5
                        break
                    case "x":
                        var offset=text.substring(i+2,text.indexOf(_q,i+2))
                        x+=parseInt(offset)
                        i+=offset.length+2
                        break
                    case "y":
                        var offset=text.substring(i+2,text.indexOf(_q,i+2))
                        y+=parseInt(offset)
                        i+=offset.length+2
                        break
                    case "l":
                        var args=text.substring(i+2,text.indexOf(_q,i+2))
                        var s=args.split(',')
                        var x1=currMargin+x+parseInt(s[0]), y1=y+parseInt(s[1])
                        ctx.beginPath()
                        ctx.moveTo(x1,y1)
                        ctx.lineTo(x1+parseInt(s[2]),y1+parseInt(s[3]))
                        ctx.stroke()
                        i+=args.length+2
                        break
                }
            }else{
                if(isHyperlink==2){
                    hyperlinkVal+=c
                    continue
                }
                ctx.fillText(text[i],x+currMargin,y)
                var cw=getCharWidth(c,charSize) //looks better than ctx.measureText(text[i]).width
                if(strikeThrough){
                    ctx.beginPath()
                    ctx.moveTo(x+currMargin,y-5)
                    ctx.lineTo(x+currMargin+cw,y-5)
                    ctx.stroke()
                }if(underline){
                    ctx.beginPath()
                    ctx.moveTo(x+currMargin,y+2)
                    ctx.lineTo(x+currMargin+cw,y+2)
                    ctx.stroke()
                }
                x+=cw
            }
        }
    }
    editor.activeTab.pageHeight=y+lineHeight

    
    //draw tabs
    ctx.fillStyle=theme.navbar_bg
    ctx.fillRect(0,0,canvas.width,30)
    
    var tabWidth=140
    editor.tabs.forEach((tab,i)=>{
        var x=i*(tabWidth+1)
        ctx.fillStyle=theme.editor_bg
        ctx.fillRect(x+tabWidth,10,1,15)
        if(i==editor.activeTabIdx || i==editor.hoverTabIdx){
            ctx.fillStyle=theme.navbar_pr
            fillRoundedRect(x,0,tabWidth,30,[10,10,10,10])
        }
        ctx.fillStyle=theme.editor_t2
        ctx.fillText(tab.title,x+10,20)
    })
    var i=editor.tabs.length
    var x=i*(tabWidth+1)
    if(i==editor.activeTabIdx || i==editor.hoverTabIdx){
        if(i!=editor.activeTabIdx)
            ctx.fillStyle=theme.editor_t1
        fillRoundedRect(x,0,30,30,[10,0,0,10])
    }
    ctx.fillStyle=theme.editor_t2
    ctx.fillText("+",x+10,20)

}
function getPageSize(){
    var text=nocol+noformat+parseCombined(editor.activeTab.content)+"\n"
    var lineHeight=20
    var charSize=8
    var x=0, y=40

    for(var i=0;i<text.length;i++){
        var c=text[i]
        if(c=='\n'){
            y+=lineHeight
            x=0
        }else{
            if(c==_q){ // formatting sequence
                switch(text[i+1]){
                    case "c": //color
                        ctx.strokeStyle="#"+text.substring(i+2,i+8)
                        ctx.fillStyle="#"+text.substring(i+2,i+8)
                        i+=7
                        break
                    case "\n"://vertical offset
                        y+=lineHeight
                        i+=1
                        break
                    case "1": //normal size
                        ctx.font="11pt Arial"
                        charSize=8
                        y+=5
                        i++
                        break
                    case "2": //header2
                        ctx.font="bold 16pt Arial"
                        y+=24
                        charSize=12
                        i++
                        break
                    case "3": //header1
                        ctx.font="bold 20pt Arial"
                        y+=35
                        charSize=15
                        i++
                        break
                }
            }
        }
    }
    return y+lineHeight
}
function getCharWidth(c:string,x:number=8){
    return Math.floor(ctx.measureText(c).width+1)
    if("mw".indexOf(c.toLowerCase())>=0)x*=1.5
    else if(".*/?r\"[]{}".indexOf(c)>=0)x*=0.75
    else if("tlifI|!():".indexOf(c)>=0)x*=0.5
    else if("RCD+".indexOf(c)>=0)x*=1.25
    return x
}
function getStringWidth(text:string){
    var width=0
    for(var i=0;i<text.length;i++)
            width+=getCharWidth(text[i])
    return width 
}
function fillRoundedRect(x:number,y:number,width:number,height:number,radius:number|number[]=0){
    // radius is given clockwise, from top-right.
    if(!Array.isArray(radius)) radius=[radius,radius,radius,radius]
    ctx.beginPath();
    ctx.moveTo(x + radius[3], y);
    ctx.lineTo(x + width - radius[0], y);
    ctx.arcTo(x + width, y, x + width, y + radius[0], radius[0]);
    ctx.lineTo(x + width, y + height - radius[1]);
    ctx.arcTo(x + width, y + height, x + width - radius[1], y + height, radius[1]);
    ctx.lineTo(x + radius[2], y + height);
    ctx.arcTo(x, y + height, x, y + height - radius[2], radius[2]);
    ctx.lineTo(x, y + radius[3]);
    ctx.arcTo(x, y, x + radius[3], y, radius[3]);
    ctx.fill();
    ctx.closePath(); // Close the path
    ctx.beginPath();
}