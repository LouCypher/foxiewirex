FoxieWire.dndObserver = {

  onDrop: function foxiewireDNDObserver_onDrop(aEvent, aXferData, aDragSession) {
    var split = aXferData.data.split("\n");
    var url = split[0];
    if (url != aXferData.data) {
      var dialogArgs = {name:split[1], url:url};
      FoxieWire.submit(dialogArgs.url);
    } else {
      split = aXferData.data.split(" ");
      url = split[0];
      try {
        FoxieWire.submit(FoxieWire.makeURI(url).spec);
      } catch(ex) {
        FoxieWire.invalidURI(url);
      }
    }
  },

  onDragOver: function foxiewireDNDObserver_onDragOver(aEvent, aFlavour, aDragSession) {
    FoxieWire.setStatus(FoxieWire.stringBundle.getString("dropLinkOnButt"));
    aDragSession.dragAction = Components.interfaces.nsIDragService
                                                   .DRAGDROP_ACTION_LINK;
  },

  onDragExit: function foxiewireDNDObserver_onDragExit(aEvent, aDragSession) {
    FoxieWire.setStatus("");
  },

  getSupportedFlavours: function foxiewireDNDObserver_getSupportedFlavours() {
    var flavourSet = new FlavourSet;
    flavourSet.appendFlavour("text/x-moz-url");
    flavourSet.appendFlavour("text/unicode");
    return flavourSet;
  }
}

