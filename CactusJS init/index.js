const path=require('path')
const {app,BrowserWindow}=require('electron')
const isDev=process.env.NODE_ENV!=='production'

function createMainWindow(){
    const mainWindow = new BrowserWindow({
        title:'Cactus',
        width:1500,
        height:600
    })
    mainWindow.setMenu(null)
    mainWindow.loadURL(path.join(__dirname,'./public/index.html'))

    //open devtools if in dev env
    if(isDev) mainWindow.webContents.openDevTools()
}

app.whenReady().then(()=>{ //returns a promise ;)
    createMainWindow()
    app.on('activate',()=>{
        if(BrowserWindow.getAllWindows().length===0) 
            createMainWindow()
    })
})

app.on('window-all-closed',()=>{
    //close app if platform!=mac, for cross-platform. include in all projects.
    if(process.platform!='darwin') app.quit()
})