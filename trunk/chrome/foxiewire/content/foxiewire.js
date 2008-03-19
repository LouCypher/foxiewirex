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

  invalidURI: function foxiewire_invalidURI(aString) {
    var string = this.stringBundle
                     .getFormattedString("invalidURI", [aString]);
    this.promptService.alert(null, "FoxieWire", string);
  },

  openPrefs: function foxiewire_openPrefs() {
    openDialog("chrome://foxiewire/content/options.xul",
               "foxiewire-config",
               "chrome, dialog, centerscreen");
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

  makeURI: function foxiewire_makeURI(aURL, aOriginCharset, aBaseURI) {
    var ioService = Components.classes['@mozilla.org/network/io-service;1']
                              .getService(Components.interfaces.nsIIOService);
    return ioService.newURI(aURL, aOriginCharset, aBaseURI);
  },

  submit: function foxiewire_submit(aURL) {
    if (this.isValidScheme(aURL)) {
      var url = this.URL + encodeURIComponent(aURL);
      switch (this.prefOpen) {
        case 0: // current tab
          loadURI(url);
          break;
        case 2: // new window
          if (this.mainWindow) { // load in new window
            window.openDialog(getBrowserURL(), "_blank", "chrome,all,dialog=no",
                              url);
          } else { // load in default browser
            Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                      .getService(Components.interfaces.nsIExternalProtocolService)
                      .loadURI(this.makeURI(url), null);
          }
          break;
        case 3: // split browser
          if (typeof SplitBrowser == "object") {
            SplitBrowser.addSubBrowser(url, null,
                                       this.pref.getIntPref("SplitBrowser.position"))
            break;
          }
        default: // new tab
          gBrowser.loadOneTab(url, null, null, null, this.prefBackgroundTab);
      }
    } else { // unsupported protocol
      var scheme = [aURL.match(/^\S[^\:]+\:/).toString()];
      var string = this.stringBundle.getFormattedString("invalidScheme", scheme);
      this.promptService.alert(null, "FoxieWire", string);
    }
  },

  getSelectionFromDocument: function foxiewire_getSelectionFromDocument(aDocument) {
    return aDocument.getSelection().toString();
  },

  submitStringAsURI: function foxiewire_submitStringAsURI(aString) {
    try {
      this.submit(this.makeURI(aString).spec);
    } catch(ex) {
      this.invalidURI(aString);
    }
  },

  setStatus: function foxiewire_setStatus(aString) {
    var status = document.getElementById("sb-status-bar-status-label") || // Songbird
                 document.getElementById("statusbar-display");
    if (status.localName == "statusbarpanel") {
      status.label = aString;
    } else { // Songbird
      status.desc.value = aString;
    }
    
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

    gContextMenu.showItem("context-foxiewire-submitselection",
                          gContextMenu.isTextSelected &&
                          this.isValidScheme(
                              this.getSelectionFromDocument(
                                  gContextMenu.target.ownerDocument)));

  },

  initSongbirdContext: function foxiewire_initSongbirdContext(aEvent) {
    var elem = document.popupNode;
    while (elem && elem.tagName && elem.tagName.toLowerCase() != "a") {
      elem = elem.parentNode;
    }
  },

  init: function foxiewire_init(aEvent) {
    if (typeof nsContextMenu != "function") {
      return;
    }
    var cm = document.getElementById("contentAreaContextMenu");
    cm.addEventListener("popupshowing", function(e) {
      FoxieWire.initContext(e);
    }, false);
  }
}

window.addEventListener("load", FoxieWire.init, false);

