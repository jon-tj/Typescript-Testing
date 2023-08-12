var Tab = /** @class */ (function () {
    function Tab(title, content) {
        this.title = title;
        this.content = content;
        this.title = title;
        this.content = content;
        this.undoLog = [];
        this.undoLogCursor = -1;
        this.selectionIdx = { start: 0, end: 0 };
        this.scrollX = 0;
        this.scrollY = 0;
    }
    Object.defineProperty(Tab.prototype, "selection", {
        get: function () {
            if (this.selectionIdx.start == this.selectionIdx.end)
                return null;
            var minIdx = Math.min(this.selectionIdx.start, this.selectionIdx.end);
            var maxIdx = Math.max(this.selectionIdx.start, this.selectionIdx.end);
            //? should it be maxIdx+1? or just maxIdx?
            return this.content.substring(minIdx, maxIdx + 1);
        },
        enumerable: false,
        configurable: true
    });
    Tab.prototype.write = function (c) {
        this.content = this.content.slice(0, this.selectionIdx.start) + c + this.content.slice(this.selectionIdx.end);
        this.selectionIdx.start += c.length;
        this.selectionIdx.end = this.selectionIdx.start;
    };
    Tab.prototype.updatePageSize = function () {
        this.pageHeight = getPageSize();
    };
    return Tab;
}());
var Editor = /** @class */ (function () {
    function Editor(canvas, tabs) {
        if (tabs === void 0) { tabs = []; }
        this.canvas = canvas;
        this.tabs = tabs;
        this.activeTabIdx = 0; // should be set to null
        this.hoverTabIdx = null;
    }
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
    Object.defineProperty(Editor.prototype, "activeTab", {
        get: function () {
            if (this.activeTabIdx != null)
                return this.tabs[this.activeTabIdx];
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
    Editor.prototype.closeTab = function (tabIdx) {
        if (tabIdx === void 0) { tabIdx = -1; }
        if (tabIdx == -1) {
            if (this.activeTabIdx)
                tabIdx = this.activeTabIdx;
            else
                return;
        }
        this.tabs.splice(tabIdx, 1);
        this.activeTabIdx = Math.min(this.activeTabIdx, this.tabs.length - 1);
        if (this.activeTabIdx == -1)
            this.activeTabIdx = null;
    };
    Editor.prototype.write = function (c) {
        var tab = this.activeTab;
        if (tab)
            tab.write(c);
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
document.body.addEventListener('keydown', function (e) {
    editor.write(e.key);
});
//# sourceMappingURL=text-editor.js.map