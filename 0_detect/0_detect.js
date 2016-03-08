(function() {
var infos = [], debug;
var centerC = 60;
var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
if (typeof navigator.requestMIDIAccess !== "undefined") {
    navigator.requestMIDIAccess().then( success, failure );
} else {
    infos.push("Web MIDI is not supported with this browser.");
}

function success(midiAccess) {
    console.debug(midiAccess);
    infos.push("=== midi access success ===");
    infos.push("Sysex Enabled: " + midiAccess.sysexEnabled);

    var inputIterator = midiAccess.inputs.values();
    var inputs = [];

    infos.push("=== inputs ===");
    for (var n = inputIterator.next(); !n.done; n = inputIterator.next()) {
        var input = n.value;
        inputs.push(input);
        input.onmidimessage = midiMessageHandler
        infos.push(input.name);
    }
    console.log(inputs);
    infos.push("=== midi ready ===");
    updateDebug();
}
function failure(error) {
    console.log(error);
    infos.push(error);
    updateDebug();
}
function midiMessageHandler(event) {
    console.log(event);
    var type = "";
    var isNote = false;
    var data = "";
    switch (event.data[0]){
        case 144: type = "Note On"; isNote = true; break;
        case 128: type = "Note Off"; isNote = true; break;
        case 176: type = "Control Change"; data = "[" + event.data[1] + "] value(" + event.data[2] + ")"; break;
        default:
    }
    if (isNote) {
        var note = event.data[1];
        note %= 12;
        data = notes[note];
    }
    infos.push("["+event.receivedTime+"] "+ event.data + " (" + event.currentTarget.name + ")" + "    " + type + " " + data);
    updateDebug();
}
function updateDebug() {
    if (typeof debug !== 'undefined') {
        debug.innerHTML = "";
        debug.innerHTML += infos.join("\n");
    }
}
document.addEventListener('DOMContentLoaded', function(e) {
    debug = document.getElementById('debug');
    updateDebug();
}, false);
})();
