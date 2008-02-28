var FoxieWire = {

  URL: "http://www.foxiewire.com/submit.php?sourceid=FoxieWire+Extension&url=",

  get stringBundle() {
    return document.getElementById("foxiewire-strings");
  },

  get promptService() {
    return Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  },

  get pref() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefBranch)
                     .getBranch("extensions.FoxieWire.");
  },

  get prefOpen() {
    return this.pref.getIntPref("openSubmit");
  },

  get prefBackgroundTab() {
    switch (this.pref.getIntPref("backgroundTab")) {
      case 0: return false; // focus new tab
      case 1: return true;  // load tab in background
      default: return null; // use Firefox default
    }
  },

  isValidScheme: function foxiewire_isValidScheme(aProtocol) {
    var reg = new RegExp("^https?|^ftp", "i");
    return reg.test(aProtocol);
  },

  openPrefs: function foxiewire_openPrefs() {
    openDialog("chrome://foxiewire/content/options.xul",
               "foxiewire-config",
               "chrome, dialog, centerscreen");
  },

  submit: function foxiewire_submit(aURL) {
    if (this.isValidScheme(aURL)) {
      switch (this.prefOpen) {
        case 0: // current tab
          loadURI(this.URL + encodeURIComponent(aURL));
          break;
        case 2: // new window
          window.openDialog(getBrowserURL(), "_blank", "chrome,all,dialog=no",
                            this.URL + encodeURIComponent(aURL));
          break;
        case 3: // split browser
          if (typeof SplitBrowser == "object") {
            SplitBrowser.addSubBrowser(this.URL + encodeURIComponent(aURL), null,
                                       this.pref.getIntPref("SplitBrowser.position"))
            break;
          }
        default: // new tab
          gBrowser.loadOneTab(this.URL + encodeURIComponent(aURL),
                              null, null, null, this.prefBackgroundTab);
      }
    } else { // unsupported protocol
      var scheme = [aURL.match(/^\S[^\:]+\:/).toString()];
      var string = this.stringBundle.getFormattedString("invalidScheme", scheme);
      this.promptService.alert(null, "FoxieWire", string);
    }
  },

  setStatus: function foxiewire_setStatus(aString) {
    document.getElementById("statusbar-display").label = aString;
  },

  initContext: function foxiewire_initContext(aEvent) {
    gContextMenu.showItem("context-foxiewire-link",
                          gContextMenu.onLink &&
                          this.isValidScheme(gContextMenu.linkProtocol));

    gContextMenu.showItem("context-foxiewire-page",
                          !(gContextMenu.isContentSelected ||
                            gContextMenu.onTextInput ||
                            gContextMenu.onLink ||
                            gContextMenu.onImage) &&
                          this.isValidScheme(content.document
                                                    .location.protocol));

    gContextMenu.showItem("context-foxiewire-frame",
                          gContextMenu.inFrame &&
                          this.isValidScheme(gContextMenu.target
                                                          .ownerDocument
                                                          .location.protocol));
  },

  init: function foxiewire_init(aEvent) {
    var cm = document.getElementById("contentAreaContextMenu");
    cm.addEventListener("popupshowing", function(e) {
      FoxieWire.initContext(e);
    }, false);
  }
}

window.addEventListener("load", FoxieWire.init, false);

