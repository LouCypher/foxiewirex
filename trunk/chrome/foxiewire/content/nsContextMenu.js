/*
  Version: MPL 1.1/GPL 2.0/LGPL 2.1

  The contents of this file are subject to the Mozilla Public License
  Version 1.1 (the "License"); you may not use this file except in
  compliance with the License. You may obtain a copy of the License at
  http://www.mozilla.org/MPL/

  Software distributed under the License is distributed on an "AS IS" basis,
  WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
  for the specific language governing rights and limitations under the
  License.

  The Original Code is mozilla.org code.

  The Initial Developer of the Original Code is
  Netscape Communications Corporation.
  Portions created by the Initial Developer are Copyright (C) 1998
  the Initial Developer. All Rights Reserved.

  Contributor(s):
  - See http://lxr.mozilla.org/seamonkey/source/browser/base/content/nsContextMenu.js

  Alternatively, the contents of this file may be used under the terms of
  either the GNU General Public License Version 2 or later (the "GPL"), or
  the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
  in which case the provisions of the GPL or the LGPL are applicable instead
  of those above. If you wish to allow use of your version of this file only
  under the terms of either the GPL or the LGPL, and not to allow others to
  use your version of this file under the terms of the MPL, indicate your
  decision by deleting the provisions above and replace them with the notice
  and other provisions required by the GPL or the LGPL. If you do not delete
  the provisions above, a recipient may use your version of this file under
  the terms of any one of the MPL, the GPL or the LGPL.
*/

function fxContextMenu(aXulMenu, aBrowser) {
  this.target            = null;
  this.browser           = null;
  this.menu              = null;
  this.isFrameImage      = false;
  this.onTextInput       = false;
  this.onKeywordField    = false;
  this.onImage           = false;
  this.onLink            = false;
  this.link              = false;
  this.linkURL           = "";
  this.linkURI           = null;
  this.linkProtocol      = null;
  this.inFrame           = false;
  this.isTextSelected    = false;
  this.isContentSelected = false;
  this.ellipsis = "\u2026";
  try {
    this.ellipsis = gPrefService.getComplexValue("intl.ellipsis",
                                                 Components.interfaces
                                                           .nsIPrefLocalizedString)
                                                           .data;
  } catch (e) { }

  // Initialize new menu.
  this.initMenu(aXulMenu, aBrowser);
}

// Prototype for nsContextMenu "class."
fxContextMenu.prototype = {
  // onDestroy is a no-op at this point.
  onDestroy: function () {
  },

  // Initialize context menu.
  initMenu: function CM_initMenu(aPopup, aBrowser) {
    this.menu = aPopup;
    this.browser = aBrowser;

    this.isFrameImage = document.getElementById("isFrameImage");

    // Get contextual info.
    this.setTarget(document.popupNode, document.popupRangeParent,
                   document.popupRangeOffset);

    this.isTextSelected = this.isTextSelection();
    this.isContentSelected = this.isContentSelection();
  },

  // Set various context menu attributes based on the state of the world.
  setTarget: function (aNode, aRangeParent, aRangeOffset) {
    // Initialize contextual info.
    this.onImage           = false;
    this.onTextInput       = false;
    this.onKeywordField    = false;
    this.imageURL          = "";
    this.onLink            = false;
    this.linkURL           = "";
    this.linkURI           = null;
    this.linkProtocol      = "";
    this.inFrame           = false;

    // Remember the node that was clicked.
    this.target = aNode;

    // First, do checks for nodes that never have children.
    if (this.target.nodeType == Node.ELEMENT_NODE) {
      // See if the user clicked on an image.
      if (this.target instanceof Components.interfaces.nsIImageLoadingContent &&
          this.target.currentURI) {
        this.onImage = true;
        this.imageURL = this.target.currentURI.spec;
      }
      else if (this.target instanceof HTMLInputElement ) {
        this.onTextInput = this.isTargetATextBox(this.target);
        this.onKeywordField = this.isTargetAKeywordField(this.target);
      }
      else if (this.target instanceof HTMLTextAreaElement) {
        this.onTextInput = true;
      }
    }

    // Second, bubble out, looking for items of interest that can have childen.
    // Always pick the innermost link, background image, etc.
    var elem = this.target;
    while (elem) {
      if (elem.nodeType == Node.ELEMENT_NODE) {
        // Link?
        if (!this.onLink &&
             ((elem instanceof HTMLAnchorElement && elem.href) ||
              (elem instanceof HTMLAreaElement && elem.href) ||
              elem instanceof HTMLLinkElement ||
              elem.getAttributeNS("http://www.w3.org/1999/xlink", "type") == "simple")) {
            
          // Target is a link or a descendant of a link.
          this.onLink = true;

          // xxxmpc: this is kind of a hack to work around a Gecko bug (see bug 266932)
          // we're going to walk up the DOM looking for a parent link node,
          // this shouldn't be necessary, but we're matching the existing behaviour for left click
          var realLink = elem;
          var parent = elem.parentNode;
          while (parent) {
            try {
              if ((parent instanceof HTMLAnchorElement && parent.href) ||
                  (parent instanceof HTMLAreaElement && parent.href) ||
                  parent instanceof HTMLLinkElement ||
                  parent.getAttributeNS("http://www.w3.org/1999/xlink", "type") == "simple")
                realLink = parent;
            } catch (e) { }
            parent = parent.parentNode;
          }
          
          // Remember corresponding element.
          this.link = realLink;
          this.linkURL = this.getLinkURL();
          this.linkURI = this.getLinkURI();
          this.linkProtocol = this.getLinkProtocol();
        }

      }

      elem = elem.parentNode;
    }

    // See if the user clicked in a frame.
    var docDefaultView = this.target.ownerDocument.defaultView;
    if (docDefaultView != docDefaultView.top)
      this.inFrame = true;

  },


  ///////////////
  // Utilities //
  ///////////////

  // Show/hide one item (specified via name or the item element itself).
  showItem: function(aItemOrId, aShow) {
    var item = aItemOrId.constructor == String ?
      document.getElementById(aItemOrId) : aItemOrId;
    if (item)
      item.hidden = !aShow;
  },

  // Generate fully qualified URL for clicked-on link.
  getLinkURL: function() {
    var href = this.link.href;  
    if (href)
      return href;

    href = this.link.getAttributeNS("http://www.w3.org/1999/xlink",
                                    "href");

    if (!href || !href.match(/\S/)) {
      // Without this we try to save as the current doc,
      // for example, HTML case also throws if empty
      throw "Empty href";
    }

    return makeURLAbsolute(this.link.baseURI, href);
  },
  
  getLinkURI: function() {
    try {
      return FoxieWire.makeURI(this.linkURL, null, null);
    }
    catch (ex) {
     // e.g. empty URL string
    }

    return null;
  },
  
  getLinkProtocol: function() {
    if (this.linkURI)
      return this.linkURI.scheme; // can be |undefined|

    return null;
  },

  // Get text of link.
  linkText: function() {
    var text = gatherTextUnder(this.link);
    if (!text || !text.match(/\S/)) {
      text = this.link.getAttribute("title");
      if (!text || !text.match(/\S/)) {
        text = this.link.getAttribute("alt");
        if (!text || !text.match(/\S/))
          text = this.linkURL;
      }
    }

    return text;
  },

  // Get selected text. Only display the first 15 chars.
  isTextSelection: function() {
    // Get 16 characters, so that we can trim the selection if it's greater
    // than 15 chars

    const kMaxSelectionLen = 150;
    const charLen = Math.min(16 || kMaxSelectionLen, kMaxSelectionLen);
    var selection = FoxieWire.selectedText;
    if (selection) {
      if (selection.length > charLen) {
        var pattern = new RegExp("^(?:\\s*.){0," + charLen + "}");
        pattern.test(selection);
        selection = RegExp.lastMatch;
      }
      selection = selection.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " ");
      if (selection.length > charLen) {
        selection = selection.substr(0, charLen);
      }
    }

    if (!selection) return false;
    if (selection.length > 15)
      selection = selection.substr(0,15) + this.ellipsis;

    return true;
  },

  // Returns true if anything is selected.
  isContentSelection: function() {
    return !document.commandDispatcher.focusedWindow.getSelection().isCollapsed;
  },

  toString: function () {
    return "contextMenu.target     = " + this.target + "\n" +
           "contextMenu.onImage    = " + this.onImage + "\n" +
           "contextMenu.onLink     = " + this.onLink + "\n" +
           "contextMenu.link       = " + this.link + "\n" +
           "contextMenu.inFrame    = " + this.inFrame + "\n";
  },

  isTargetATextBox: function(node) {
    if (node instanceof HTMLInputElement)
      return (node.type == "text" || node.type == "password")

    return (node instanceof HTMLTextAreaElement);
  },

  isTargetAKeywordField: function(aNode) {
    var form = aNode.form;
    if (!form)
      return false;

    var method = form.method.toUpperCase();

    // These are the following types of forms we can create keywords for:
    //
    // method   encoding type       can create keyword
    // GET      *                                 YES
    //          *                                 YES
    // POST                                       YES
    // POST     application/x-www-form-urlencoded YES
    // POST     text/plain                        NO (a little tricky to do)
    // POST     multipart/form-data               NO
    // POST     everything else                   YES
    return (method == "GET" || method == "") ||
           (form.enctype != "text/plain") && (form.enctype != "multipart/form-data");
  }

};

