// VVV edit this to make new menu items ;))
var menuTree = {
    'File': {
        'New|Ctrl+N': function () { return console.log('new'); },
        'Open|Ctrl+O': function () { return console.log('open'); },
        'Save|Ctrl+S': function () { return console.log('save'); }
    },
    'Edit': {
        'Undo|Ctrl+Z': editor.undo,
        'Redo|Ctrl+Shift+Z': editor.redo,
        'Find|Ctrl+F': function () { return console.log('find'); },
        'Replace|Ctrl+R': function () { return console.log('replace'); }
    },
    'Run|Ctrl+Q': function () {
        // Run a selection if it can be found, otherwise run the file
        terminal.show();
        terminal.print('Running...');
        var tab = editor.activeTab;
        if (!tab)
            return;
        var selection = tab.selection;
        if (selection)
            tryRunSnippet(selection);
        else
            tryRunSnippet(tab.content);
    }
};
//#region the glue that makes it all work
var navbar = document.querySelector('#navbar');
var mainEnv = document.querySelector('#main-env');
var root = document.createElement("ul");
var focusedMenu = null;
root.classList.add("navbar");
root.classList.add("horizontal");
navbar.append(root);
function hideActiveMenu() {
    if (focusedMenu) {
        focusedMenu.classList.add('hidden');
        focusedMenu = null;
    }
}
function createMenuItem(parent, obj, name, level) {
    if (name === void 0) { name = ""; }
    if (level === void 0) { level = 0; }
    if (level == 0) {
        Object.keys(obj).forEach(function (key) {
            parent.append(createMenuItem(parent, obj[key], key, 1));
        });
        return;
    }
    var li = document.createElement('li');
    if (level == 1)
        li.classList.add("navbar");
    var s = name.split('|');
    li.innerText = s[0];
    if (s.length > 1) {
        li.innerHTML += "<span>" + s[1] + "</span>";
        shortcutKeys[s[1]] = obj;
    }
    parent.append(li);
    if (obj instanceof (Function)) {
        li.addEventListener('click', obj);
        li.classList.add("show");
        if (level == 1)
            li.addEventListener('mouseenter', function () {
                if (focusedMenu) {
                    focusedMenu.classList.add("hidden");
                    focusedMenu = li;
                }
            });
    }
    else {
        var r = document.createElement("ul");
        r.classList.add("navbar");
        r.classList.add("vertical");
        r.classList.add("hidden");
        li.append(r);
        //#region toggle when clicked
        li.addEventListener('mouseenter', function () {
            if (focusedMenu && focusedMenu != r) {
                focusedMenu.classList.add("hidden");
                focusedMenu = r;
                focusedMenu.classList.remove("hidden");
            }
        });
        li.addEventListener('click', function (e) {
            if (focusedMenu == r) {
                focusedMenu.classList.add("hidden");
                focusedMenu = null;
            }
            else {
                focusedMenu = r;
                focusedMenu.classList.remove("hidden");
            }
            e.preventDefault();
        });
        //#endregion
        Object.keys(obj).forEach(function (key) {
            r.append(createMenuItem(r, obj[key], key, level + 1));
        });
    }
    return li;
}
var shortcutKeys = {};
createMenuItem(root, menuTree);
mainEnv.addEventListener('click', hideActiveMenu);
//#endregion
//# sourceMappingURL=navbar-builder.js.map