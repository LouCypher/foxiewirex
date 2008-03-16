var FoxieWire_Config = {
  get prefService() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService);
  },

  get prefs() {
    return this.prefService.getBranch("extensions.FoxieWire.");
  },

  get stringBundle() {
    return document.getElementById("foxiewire-strings");
  },

  toggle: function foxiewireConfig_toggle(aElm, aID) {
    var node = document.getElementById(aID);
    node.disabled = !aElm.selected;
  },

  get mainWindow() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                .getService();
    var wmInterface = wm.QueryInterface(Components.interfaces.nsIWindowMediator);
    var eb = wmInterface.getEnumerator("navigator:browser");
    if (eb.hasMoreElements()) {
      return eb.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
    }
    return null;
  },

  get splitBrowser() {
    return this.mainWindow
            ? (typeof this.mainWindow.SplitBrowser == "object")
            : null;
  },

  init: function() {
    var newTab = document.getElementById("open-new-tab");
    var newTabBox = document.getElementById("tab-focus-pref");
    var split = document.getElementById("open-split-browser");
    var splitPref = document.getElementById("split-browser-pref");
    var splitBox = document.getElementById("split-browser-groupbox");

    if (!this.mainWindow) {
      document.getElementById("open-new-window")
              .setAttribute("label",  this.stringBundle
                                          .getString("defaultBrowser"));
    }

    newTabBox.disabled = !newTab.selected;
    splitPref.disabled = !split.selected;;
    split.hidden = !this.splitBrowser;
    splitBox.hidden = !this.splitBrowser;

    newTab.addEventListener("DOMAttrModified", function(e) {
      FoxieWire_Config.toggle(e.target, "tab-focus-pref");
    }, false);

    split.addEventListener("DOMAttrModified", function(e) {
      FoxieWire_Config.toggle(e.target, "split-browser-pref");
    }, false);

  }
}

window.addEventListener("load", function(e) {
  FoxieWire_Config.init();
}, false);

