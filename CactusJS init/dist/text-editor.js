var Tab = /** @class */ (function () {
    function Tab(title, content) {
        this.title = title;
        this.content = content;
        this.title = title;
        this.content = content;
        this.undoLog = [];
        this.undoLogCursor = -1;
    }
    Object.defineProperty(Tab.prototype, "selection", {
        get: function () {
            return this.content; //!not implemented
        },
        enumerable: false,
        configurable: true
    });
    return Tab;
}());
var Editor = /** @class */ (function () {
    function Editor(tabs) {
        if (tabs === void 0) { tabs = []; }
        this.tabs = tabs;
        this.tabs = tabs;
    }
    Object.defineProperty(Editor.prototype, "activeTab", {
        get: function () {
            if (this.tabs.length == 0)
                return null;
            return this.tabs[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Editor.prototype, "isEmpty", {
        get: function () { return this.tabs.length == 0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Editor.prototype, "selection", {
        get: function () {
            if (this.activeTab)
                return this.activeTab.selection;
            else
                return null;
        },
        enumerable: false,
        configurable: true
    });
    Editor.prototype.undo = function () {
        var tab = this.activeTab;
        if (tab && tab.undoLog.length > 0 && tab.undoLogCursor >= 0) {
            tab.undoLog[tab.undoLogCursor].undo();
            tab.undoLogCursor--;
        }
    };
    Editor.prototype.redo = function () {
        var tab = this.activeTab;
        if (tab && tab.undoLog.length > 0 && tab.undoLogCursor < tab.undoLog.length - 1) {
            tab.undoLog[tab.undoLogCursor].redo();
            tab.undoLogCursor++;
        }
    };
    return Editor;
}());
var UndoAction = /** @class */ (function () {
    function UndoAction(editor) {
        this.editor = editor;
        this.editor = editor;
    }
    UndoAction.prototype.undo = function () {
        //!not implemented
    };
    UndoAction.prototype.redo = function () {
        //!not implemented
    };
    return UndoAction;
}());
//# sourceMappingURL=text-editor.js.map