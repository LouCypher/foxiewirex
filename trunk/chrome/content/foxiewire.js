var FoxieWire = {

  URL: "http://www.foxiewire.com/submit.php?sourceid=FoxieWire+Extension&url=",

  get pref() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefBranch)
                     .getBranch("extensions.FoxieWire.");
  },

  get openInTab() {
    return this.pref.getBoolPref("openInTab");
  },

  get loadInBackground() {
    switch (this.pref.getIntPref("openInTab.loadInBackground")) {
      case 0: return false;
      case 1: return true;
      default: return null;
    }
  },

  isValidScheme: function foxiewire_isValidScheme(aProtocol) {
    var reg = new RegExp("^https?|^ftp", "i");
    return reg.test(aProtocol);
  },

  submit: function foxiewire_submit(aURL) {
    if (this.isValidScheme(aURL)) {
      if (this.openInTab) {
        gBrowser.loadOneTab(this.URL + encodeURIComponent(aURL),
                            null, null, null, this.loadInBackground);
      } else {
        loadURI(this.URL + encodeURIComponent(aURL));
      }
    } else {
      var STRINGS = document.getElementById("foxiewire-strings");
      var scheme = [aURL.match(/^\S[^\:]+\:/).toString()];
      var string = STRINGS.getFormattedString("invalidScheme", scheme);

      var PROMPTS = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                              .getService(Components.interfaces.nsIPromptService);
      PROMPTS.alert(null, "FoxieWire", string);
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

