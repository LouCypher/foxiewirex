var FoxieWire = {

  URL: "http://www.foxiewire.com/submit.php?sourceid=FoxieWire+Extension&url=",

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

FoxieWire.buttonObserver = {
  onDrop: function foxiewireButtonObserver_onDrop(aEvent, aXferData, aDragSession) {
    var split = aXferData.data.split("\n");
    var url = split[0];
    if (url != aXferData.data) {
      var dialogArgs = {name:split[1], url:url};
      FoxieWire.submit(dialogArgs.url);
    }
  },

  onDragOver: function foxiewireButtonObserver_onDragOver(aEvent, aFlavour, aDragSession) {
    var STRINGS = document.getElementById("foxiewire-strings");
    FoxieWire.setStatus(STRINGS.getString("dropLinkOnButt"));
    aDragSession.dragAction = Components.interfaces.nsIDragService
                                                   .DRAGDROP_ACTION_LINK;
  },

  onDragExit: function foxiewireButtonObserver_onDragExit(aEvent, aDragSession) {
    FoxieWire.setStatus("");
  },

  getSupportedFlavours: function foxiewireButtonObserver_getSupportedFlavours() {
    var flavourSet = new FlavourSet;
    flavourSet.appendFlavour("application/x-moz-file", "nsIFile");
    flavourSet.appendFlavour("text/x-moz-url");
    flavourSet.appendFlavour("text/unicode");
    return flavourSet;
  }
}

window.addEventListener("load", FoxieWire.init, false);

