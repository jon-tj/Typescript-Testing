function tryRunSnippet(snippet, lang) {
    if (lang === void 0) { lang = ""; }
    if (lang == 'js') {
        try {
            eval(snippet);
        }
        catch (e) {
            console.error(e);
        }
    }
    else if (lang == 'python') {
        console.log("cry about it");
    }
    else if (lang == 'html') {
        //should open a new tab/window with the html loaded ;))
    }
}
//# sourceMappingURL=run-snippets.js.map