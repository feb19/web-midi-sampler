(function() {
var infos = [], debug;
var centerC = 60;
var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
if (typeof navigator.requestMIDIAccess !== "undefined") {
    navigator.requestMIDIAccess().then( success, failure );
} else {
    infos.push("Web MIDI is not supported with this browser.");
}
var context=null;   // the Web Audio "context" object
window.AudioContext=window.AudioContext||window.webkitAudioContext;
context = new AudioContext();
var oscillator=null;  // the single oscillator
var envelope=null;    // the envelope for the single oscillator
var attack=0.05;      // attack speed
var release=0.05;   // release speed
var portamento=0.05;  // portamento/glide speed
var activeNotes = []; // the stack of actively-pressed keys
// set up the basic oscillator chain, muted to begin with.
oscillator = context.createOscillator();
oscillator.frequency.setValueAtTime(110, 0);
envelope = context.createGain();
oscillator.connect(envelope);
envelope.connect(context.destination);
envelope.gain.value = 0.0;  // Mute the sound
oscillator.start(0);  // Go ahead and start up the oscillator

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
        case 144: type = "Note On"; isNote = true; noteOn(event.data[1]); break;
        case 128: type = "Note Off"; isNote = true; noteOff(event.data[1]); break;
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

function frequencyFromNoteNumber( note ) {
  return 440 * Math.pow(2,(note-69)/12);
}

function noteOn(noteNumber) {
  activeNotes.push( noteNumber );
  oscillator.frequency.cancelScheduledValues(0);
  oscillator.frequency.setTargetAtTime( frequencyFromNoteNumber(noteNumber), 0, portamento );
  envelope.gain.cancelScheduledValues(0);
  envelope.gain.setTargetAtTime(0.2, 0, attack);
}

function noteOff(noteNumber) {
  var position = activeNotes.indexOf(noteNumber);
  if (position!=-1) {
    activeNotes.splice(position,1);
  }
  if (activeNotes.length==0) {  // shut off the envelope
    envelope.gain.cancelScheduledValues(0);
    envelope.gain.setTargetAtTime(0.0, 0, release );
  } else {
    oscillator.frequency.cancelScheduledValues(0);
    oscillator.frequency.setTargetAtTime( frequencyFromNoteNumber(activeNotes[activeNotes.length-1]), 0, portamento );
  }
}
document.addEventListener('DOMContentLoaded', function(e) {
    debug = document.getElementById('debug');
    updateDebug();
}, false);
})();
