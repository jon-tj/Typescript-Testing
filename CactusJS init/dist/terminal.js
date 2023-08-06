var Terminal = /** @class */ (function () {
    function Terminal(htmlElement) {
        this.htmlElement = htmlElement;
    }
    Terminal.prototype.show = function () {
        this.htmlElement.style.height = "10em";
    };
    Terminal.prototype.hide = function () {
        this.htmlElement.style.height = "1em";
    };
    Terminal.prototype.print = function (msg) {
        this.htmlElement.innerHTML += "<br>" + msg;
    };
    return Terminal;
}());
var terminal = new Terminal(document.querySelector('#terminal'));
//# sourceMappingURL=terminal.js.map