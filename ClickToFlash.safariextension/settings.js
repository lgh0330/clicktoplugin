
var main = document.getElementById("main");
var nav = document.getElementsByTagName("nav")[0].children[0];
var inputs = document.getElementsByClassName("setting");
var keyboardInputs = document.getElementsByClassName("keyboard");
var mouseInputs = document.getElementsByClassName("mouse");
var clearShortcutButtons = document.getElementsByClassName("shortcut_clear");
var killerInputs = document.getElementsByClassName("killer");

// Localization
document.title = CTF_PREFERENCES;
var strings = document.getElementsByClassName("string");
var options = document.getElementsByTagName("option");
while(strings.length > 0) {
    strings[0].parentNode.replaceChild(document.createTextNode(this[strings[0].title]), strings[0]);
}
for(var i = 0; i < options.length; i++) {
    if(options[i].hasAttribute("title")) {
        options[i].appendChild(document.createTextNode(this[options[i].title]));
        options[i].removeAttribute("title");
    }
}
document.getElementById("killers_toggle").value = TOGGLE_BUTTON;
document.getElementById("killers_all").value = SELECT_ALL_BUTTON;
for(var i = 0; i < clearShortcutButtons.length; i++) {
    clearShortcutButtons[i].value = CLEAR_BUTTON;
}

// Bind tabs to sections
var tabs = nav.children;
var sections = document.getElementsByTagName("section");
var currentSection = 0;
tabs[0].className = "selected";
sections[0].className = "selected";

main.addEventListener("webkitTransitionEnd", function(event) {
    event.target.className = "";
    event.target.style.WebkitTransitionProperty = "none";
    event.target.style.height = "intrinsic";
}, false);

function switchToTab(i) {
    var oldHeight = sections[currentSection].offsetHeight + 20;
    main.style.height = oldHeight + "px";
    tabs[currentSection].className = "";
    tabs[i].className = "selected";
    main.className = "hidden";
    sections[currentSection].className = "";
    sections[i].className = "selected";
    currentSection = i;
    var newHeight = sections[i].offsetHeight + 20;
    main.style.WebkitTransitionProperty = "height";
    var heightDelta = newHeight - oldHeight;
    if(heightDelta < 0) heightDelta = -heightDelta;    
    main.style.WebkitTransitionDuration = (.001*heightDelta) + "s";
    main.style.height = newHeight + "px";
}

function bindTab(i) {
    tabs[i].firstChild.addEventListener("click", function(event) {
        if(currentSection !== i) switchToTab(i);
    }, false);
}
for(var i = 0; i < tabs.length; i++) {
    bindTab(i);
}

nav.style.minWidth = (nav.offsetWidth + 10) + "px";

// Remove volume slider setting in WebKit nightlies
if(/\+/.test(navigator.appVersion)) {
    document.getElementById("showVolumeSlider").parentNode.parentNode.style.display = "none";
}

// Killers list
document.getElementById("killers_toggle").addEventListener("click", function() {
    for(var i = 0; i < killerInputs.length; i++) {
        killerInputs[i].checked ^= true;
    }
    changeSetting("enabledKillers", checked(killerInputs));
}, false);
document.getElementById("killers_all").addEventListener("click", function() {
    for(var i = 0; i < killerInputs.length; i++) {
        killerInputs[i].checked = true;
    }
    changeSetting("enabledKillers", checked(killerInputs));
}, false);


// Control lists
var auxDiv = document.createElement("div");
auxDiv.id = "aux";
document.body.appendChild(auxDiv);

function resizeTextArea(textarea) {
    auxDiv.textContent = textarea.value;
    var height = textarea.value.split("\n").length*16 + 15;
    var width = auxDiv.offsetWidth + 16;
    if(height > 175) height = 175;
    if(height < 47) height = 47;
    if(width > document.body.offsetWidth - 345) width = document.body.offsetWidth - 345;
    if(width < 300) width = 300
    textarea.style.minHeight = height + "px";
    textarea.style.minWidth = width + "px";
}

var textareas = document.getElementsByTagName("textarea");
function handleTextAreaInput(event) {
    event.target.value = event.target.value.replace(/[\t ]+/g, "\n");
    resizeTextArea(event.target);
}
for(var i = 0; i < textareas.length; i++) {
    textareas[i].addEventListener("keypress", function(event) {
        if(event.keyCode === 32) {
            event.preventDefault();
            var position = event.target.selectionStart;
            event.target.value = event.target.value.substr(0, position) + "\n" + event.target.value.substr(position);
            event.target.selectionEnd = position + 1;
            var e = document.createEvent("HTMLEvents");
            e.initEvent("input", true, true);
            event.target.dispatchEvent(e);
        }
    }, false);
    
    textareas[i].addEventListener("input", handleTextAreaInput, false);
    textareas[i].addEventListener("focus", handleTextAreaInput, false);
}


// Bind 'change' events
function changeSetting(setting, value) {
    safari.self.tab.dispatchMessage("changeSetting", {"setting": setting, "value": value});
}

for(var i = 0; i < inputs.length; i++) {
    bindChangeEvent(inputs[i]);
}

function bindChangeEvent(input) {
    var parseValue;
    var eventType = "change";
    switch(input.nodeName) {
        case "TEXTAREA":
            parseValue = function(value) {
                var s = value.replace(/\n+/g, "\n").replace(/^\n/, "").replace(/\n$/, "");
                if(!s) return [];
                else return s.split("\n");
            }
            break;
        case "SELECT":
            parseValue = function(value) {if(isNaN(parseInt(value))) return value; else return parseInt(value);}
            break;
        case "INPUT":
            switch(input.type) {
                case "range":
                    parseValue = function(value) {return parseInt(value)*.01}
                    break;
                case "number":
                    parseValue = function(value) {return isNaN(parseInt(value)) ? 8 : parseInt(value);};
                    eventType = "blur";
                    break;
                case "checkbox":
                    parseValue = function(value) {return value === "on";}
                    break;
            }
            break;
    }
    
    input.addEventListener(eventType, function(event) {
        changeSetting(event.target.id, parseValue(event.target.value));
    }, false);
}
for(var i = 0; i < killerInputs.length; i++) {
    killerInputs[i].addEventListener("change", function(event) {
        changeSetting("enabledKillers", checked(killerInputs));
    }, false);
}

// Shortcuts input
for(var i = 0; i < keyboardInputs.length; i++) {
    keyboardInputs[i].addEventListener("keydown", handleKeyboardEvent, false);
    clearShortcutButtons[i].addEventListener("click", function(event) {
        var textField = event.target.previousSibling.previousSibling;
        textField.value = "";
        changeSetting(textField.id, null);
    }, false);
}
function handleKeyboardEvent(event) {
    event.preventDefault();
    if(event.keyIdentifier === "Shift" || event.keyIdentifier === "Control" || event.keyIdentifier === "Alt" || event.keyIdentifier === "Meta") return;
    registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "keyIdentifier": event.keyIdentifier}, event.target);
}

for(var i = 0; i < mouseInputs.length; i++) {
    mouseInputs[i].addEventListener("click", handleClickEvent, false);
    mouseInputs[i].addEventListener("dblclick", handleClickEvent, false);
    mouseInputs[i].addEventListener("mousewheel", handleWheelEvent, false);
}
function handleClickEvent(event) {
    event.preventDefault();
    registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "button": event.button}, event.target.previousSibling);
}
function handleWheelEvent(event) {
    event.preventDefault();
    registerShortcut({"type": event.type, "shiftKey": event.shiftKey, "ctrlKey": event.ctrlKey, "altKey": event.altKey, "metaKey": event.metaKey, "direction": simplifyWheelDelta(event.wheelDeltaX, event.wheelDeltaY)}, event.target.previousSibling);
}
function registerShortcut(shortcut, input) {
    input.value = showShortcut(shortcut)
    changeSetting(input.id, shortcut);
}

function simplifyWheelDelta(x, y) {
    if(x > y && y > -x) return "left";
    if(x > y) return "down";
    if(-x > y) return "right";
    return "up";
}

function checked(inputList) {
    var array = new Array();
    for(var i = 0; i < inputList.length; i++) {
        if(inputList[i].checked) array.push(parseInt(inputList[i].id.substr(6)));
    }
    return array;
}

// Bind settings dependencies
document.getElementById("showSourceSelector").addEventListener("change", function(event) {
    document.getElementById("showPluginSourceItem").disabled = event.target.value !== "on";
    document.getElementById("showQTPSourceItem").disabled = event.target.value !== "on";
}, false);
document.getElementById("defaultPlayer").addEventListener("change", function(event) {
    if(this.value === "html5") {
        document.getElementById("mediaAutoload").disabled = false;
        var e = document.createEvent("HTMLEvents");
        e.initEvent("change", false, false);
        document.getElementById("mediaAutoload").dispatchEvent(e);
    } else {
        document.getElementById("mediaAutoload").disabled = true;
        document.getElementById("mediaAutoload").checked = false;
        document.getElementById("showPoster").disabled = false;
        document.getElementById("showMediaTooltip").disabled = false;
    }
}, false);
document.getElementById("mediaAutoload").addEventListener("change", function(event) {
    document.getElementById("preload").disabled = event.target.value === "";
    document.getElementById("showPoster").disabled = event.target.value === "on";
    document.getElementById("showMediaTooltip").disabled = event.target.value === "on";
}, false);

// Shortcut display
function parseKeyID(keyID) {
    if(/^U\+/.test(keyID)) {
        var code = parseInt(keyID.substr(2), 16);
        switch(code) {
            case 8: return "\u232b";
            case 9: return "\u21e5";
            case 27: return "\u238b";
            case 32: return "[space]";
            case 127: return "\u2326";
            default: return String.fromCharCode(code);
        }
    }
    if(keyID.charAt(0) === "F") {
        return "[F" + keyID.substr(1) + "]";
    }
    switch(keyID) {
        case "Enter": return "\u2305";
        case "Left": return "\u2190";
        case "Up": return "\u2191";
        case "Right": return "\u2192";
        case "Down": return "\u2193";
        case "Home": return "\u2196";
        case "End": return "\u2198";
        case "PageUp": return "\u21de";
        case "PageDown": return "\u21df";
        case "CapsLock": return "\u21ea";
        case "Clear": return "\u2327";
    }
}

function showShortcut(shortcut) {
    if(!shortcut) return "";
    var prefix = (shortcut.shiftKey ? "\u21e7" : "") + (shortcut.ctrlKey ? "\u2303" : "") + (shortcut.altKey ? "\u2325" : "") + (shortcut.metaKey ? "\u2318" : "");
    if(shortcut.type === "keydown") return prefix + parseKeyID(shortcut.keyIdentifier);
    if(shortcut.type === "click") return prefix + "[click" + shortcut.button + "]";
    if(shortcut.type === "dblclick") return prefix + "[dblclick" + shortcut.button + "]";
    if(shortcut.type === "mousewheel") return prefix + "[wheel" + shortcut.direction + "]";
}

// Load settings
function loadSettings(event) {
    if(event.name !== "settings") return;
    var settings = event.message;
    for(var i = 0; i < settings.enabledKillers.length; i++) {
        document.getElementById("killer" + settings.enabledKillers[i]).checked = true;
    }
    delete settings.enabledKillers;
    for(var id in settings) {
        var input = document.getElementById(id);
        if(!input) continue; // to be removed
        switch(input.nodeName) {
            case "TEXTAREA":
                var rows = settings[id].length;
                if(rows < 2) rows = 2;
                input.rows = rows;
                input.value = settings[id].join("\n");
                resizeTextArea(input);
                break;
            case "SELECT":
                var options = input.getElementsByTagName("option");
                for(var i = 0; i < options.length; i++) {
                    options[i].selected = options[i].value === settings[id] + "";
                }
                break;
            case "INPUT":
                switch(input.type) {
                    case "range":
                        input.value = settings[id]*100;
                        break;
                    case "number":
                        input.value = settings[id];
                        break;
                    case "text":
                        input.value = showShortcut(settings[id]);
                        break;
                    case "checkbox":
                        if(settings[id]) input.checked = true;
                        break;
                }
                break;
        }
    }
    if(!settings.showSourceSelector) {
        document.getElementById("showPluginSourceItem").disabled = true;
        document.getElementById("showQTPSourceItem").disabled = true;
    }
    if(settings.defaultPlayer !== "html5") document.getElementById("mediaAutoload").disabled = true;
    if(settings.mediaAutoload) {
        document.getElementById("showPoster").disabled = true;
        document.getElementById("showMediaTooltip").disabled = true;
    } else document.getElementById("preload").disabled = true;
    
    // Show settings pane
    main.className = "";
}

safari.self.addEventListener("message", loadSettings, false);

safari.self.tab.dispatchMessage("getSettings", "");

window.addEventListener("focus", function(event) {
    safari.self.tab.dispatchMessage("getSettings", "");
}, false);

