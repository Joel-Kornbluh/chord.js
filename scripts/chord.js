/**
 * Chords
 *
 * An open source API for implementing visual chord diagrams and chord playback 
 *
 * @package		Chords
 * @author		Joel-Kornbluh
 * @copyright           Copyright (c) 2012 - 2013.
 * @license		http://learnmusic123.com/legal/license
 * @link		http://learnmusic123.com/
 * @since		Version 1.0
 * @filesource
 */

// ------------------------------------------------------------------------

/**
 * Chord Class
 *
 * The main Chord class, which all chords inherit from.
 * all other files depend on this class, so it should be included first
 *
 * @package		CodeIgniter
 * @subpackage          Libraries
 * @category            Libraries
 * @author		Joel-Kornbluh
 * @link
 */


/*********************************************************************************************\
 ***************************************** Constructor ***************************************
\*********************************************************************************************/

function Chord(name,intervals,/*optional*/o){
    
    //if no name is supplied and it's not a major chord, throw an error'
    if(!name && intervals[0] != 0 && intervals[0] != 4 && intervals[0] != 7){
        throw 'Chord name must be supplied';
        return false;
    } else if(!(intervals && intervals.length)){
        throw 'The Intervals between the notes of the chord mudt be supplied in an array.';
        return false;
    } else if(!intervals.length > 1){
        throw 'A chord must consist of at least two notes';
        return false;
    }
    
    //check if the chord root is supplied as part of the chord intervals
    if(intervals[0] !== 0){
        intervals.unshift(0);
    }
    
    //initialize the newly created chord object
    this.name = name;
    this.i = intervals;
    
    //check for additional options
    if(o && typeof o == 'object'){
        
        for(option in o){
            this[option] = o[option]
        }
    }
    
}

/*********************************************************************************************\
 ************************************* Class Properties **************************************
\*********************************************************************************************/


// notes for internal use
Chord.notes = ["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"];

//notes for screen display
Chord.notesSharp = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","B♯","B"];
Chord.notesFlat = ["D","D♭","D","E♭","E","F","G♭","G","A♭","A","A♭","A"];

// the chords object.
// contains all chord objects created by new Chord(name,intervals);
Chord.chords = {};

// the fretboard object.
Chord.fretboard = {};


// the audio object
Chord.audio = {};
Chord.audio.supported = false;

// load modernizr audio check.
// actual check will be performed when page finishes loading
Chord.audio.check = document.createElement('script');
Chord.audio.check.src = 'modernizr_audio.js';
document.getElementsByTagName('body')[0].appendChild(Chord.audio.check);

// audio file format if supported. will be 'ogg' or 'mp3' depends on the browser
Chord.audio.format = '';

// the actual HTML5 audio objects of all audio files.
// will be loaded when page finishes loading
Chord.audio.files = {};
//alias for the above
var audio = Chord.audio.files;

// a reference to audio objects that are currently playing.
Chord.audio.playing = [];

// a references to audio objects in queue.
// these are timeout numbers, and can be cleared by clearTimeout(Chord.audio.queued[index])
Chord.audio.queued = [];

//clear all playing and queued notes
Chord.audio.reset = function(){
    
    for(i = 0; i < Chord.audio.queued.length; i++){
        clearTimeout(Chord.audio.queued[i]);
    }
    
    for(i = 0; i < Chord.audio.playing.length; i++){
        if(!Chord.audio.playing[i].paused && !Chord.audio.playing[i].ended && 0 < Chord.audio.playing[i].currentTime){
            Chord.audio.playing[i].pause();
            Chord.audio.playing[i].currentTime = 0;
        }
    }
    
    Chord.audio.queued.splice(0);
    Chord.audio.playing.splice(0);
    
}

/*********************************************************************************************\
 *************************************** Configuration ***************************************
\*********************************************************************************************/

// path to audio files.
// replace this if you move the files
Chord.audio.path = '../audio/'

Chord.config = {};

// if you add more audio files 
// or if you change the octave numbers of the audio files
// change this configurations as well
Chord.config.range = {
    octaves:5,
    lowestOctave:2,
    highestOctave:6,
    lowestNote:'e',
    highestNote:'e'
};

/*********************************************************************************************\
 ************************************ Chord instance Methods *********************************
\*********************************************************************************************/

//get chord name
Chord.prototype.getName = function(){
    return this.name;
}

//get short chord name
Chord.prototype.getSName = function(){
    return this.shortName;
}

//get long chord name
Chord.prototype.getLName = function(){
    return this.longName;
}

//get chord intervals
Chord.prototype.getIntervals = function(){
    return this.i;
}

Chord.prototype.getNotes = function(root,o/*optional*/){
    
    defaultOptions = {
        invert:0
    }
    
    o = extend({},defaultOptions,o);
    
    //root note of the chord, as an index in the notes array.
    rootIndex = Chord.notes.indexOf(root.toLowerCase());
    
    if(rootIndex == -1){
        throw 'unknown root note given in .'+this.getName()+'.getNotes()';
        return false;
    }
    
    //array, will hold the notes of the chord
    chord = [];

    //calculates the notes of the chord,
    //and pushes the results to "chord".
    for(i = 0; i < this.i.length; i++){
        
        var index = rootIndex + this.i[i];
        
        if(index >= Chord.notes.length){
            index = index - Chord.notes.length;
        }
        
        chord.push(Chord.notes[index]);
    }
    
    //invert the chord
    for(i = 0; i < o.invert; i++){
        chord.push(chord.shift())
    }
    
    //return the results.
    return chord;
}

Chord.prototype.getFormattedNotes = function(root,o/*optional*/){
    return this.getNotes(root,o).join(', ').toUpperCase();
}

Chord.prototype.play = function(root,o/*optional*/){
    
    defaultOptions = {
        timeInterval:20,
        octave:4
    }
    
    o = extend({},defaultOptions,o);
    
    chordNotes = this.getNotes(root,o);
    
    //debugging
    console.log(chordNotes);
    
    //reset all playing and queued audio objects before playing the new chord
    Chord.audio.reset();
    
    // function returns a function that can be passed to setTimeout in the loop
    // without overwriting everything to the latest index of the loop
    createPlayFunc = function(audio){
        return function(){
            audio.play();
        }
    }
    //play the notes of the chord
    for(i = 0, t = 0; i < chordNotes.length; i++, t += o.timeInterval){
        //debugging
        console.log(chordNotes[i]+o.octave);
        
        var playFromQueue = createPlayFunc(Chord.audio.files[chordNotes[i]+o.octave]);
        Chord.audio.queued.push(setTimeout(playFromQueue,t))
    }
    
}

Chord.prototype.strum = function(root,o/*optional*/){
    
    defaultOptions = {
        
    }
    
    o = extend({},defaultOptions,o);
    
    
    chordNotes = this.getNotes(root);
    
}
/*********************************************************************************************\
 ************************************** Predefined Chords ************************************
\*********************************************************************************************/

// this array contains all popular chord types, you can add your own chords here.
// the name property should be the common name of the chord type and should only contain lowercase letters or numbers
// the 'i' property is the intervals of the chord notes calculated in half steps from the chord root
// the 'o' property is optional and should be an object who's properties may be one or more of the following:
// 'shortName' = the shortest possible name for the chord type like 'm' for minor or '4' for suspended chords
// 'longName' = a long name for the chord type like 'minor' for minor or 'suspended 4th' for suspended chords
// 'important' = an array of the most importat chord notes. Specially usefull for long extended chords
// ''
Chord.chordTypes = [
    {name:'power',i:[0,7],o:{shortName:'5',longName:'power 5'}},
    {name:'maj',i:[0,4,7],o:{shortName:'',longName:'Major'}},
    {name:'min',i:[0,3,7],o:{shortName:'m',longName:'minor'}},
    {name:'sus2',i:[0,2,7],o:{shortName:'2',longName:'Suspended 2\'nd'}},
    {name:'sus4',i:[0,5,7],o:{shortName:'4',longName:'Suspended 4'}},
    {name:'aug',i:[0,4,8],o:{shortName:'+',longName:'Augmented'}},
    {name:'dim',i:[0,3,6],o:{shortName:'ﾟ',longName:'diminshed'}},
    {name:'flat5',i:[0,4,6],o:{shortName:'♭5',longName:'flatted 5'}},
    {name:'majmin7',i:[0,4,7,10],o:{shortName:'7',longName:'Dominant 7'}},
    {name:'min7',i:[0,3,7,10],o:{shortName:'m7',longName:'minor 7'}},
    {name:'maj7',i:[0,4,7,11],o:{shortName:'M7',longName:'Major 7'}},
    {name:'minmaj7',i:[0,3,7,1],o:{shortName:'mMaj7',longName:'minot Major 7'}},
    {name:'min7flat5',i:[0,3,6,10],o:{shortName:'m7♭5',longName:'minor 7 flatted 5'}},
    {name:'dim7',i:[0,3,6,9],o:{shortName:'ﾟ7',longName:'diminished 7'}},
    {name:'maj6',i:[0,4,7,9],o:{shortName:'6',longName:'Major 6'}},
    {name:'min6',i:[0,3,7,8],o:{shortName:'m6',longName:'minor 6'}},
    {name:'majmin6',i:[0,4,7,8],o:{shortName:'Mmin6',longName:'Major minor 6'}},
    {name:'minmaj6',i:[0,3,7,9],o:{shortName:'mMaj6',longName:'minor Major 6'}},
    {name:'min7sus4',i:[0,5,7,10],o:{shortName:'m7 sus4',longName:'minor seventh Suspended 4'}},
    {name:'maj7sus4',i:[0,5,7,11],o:{shortName:'M7 sus4',longName:'Major 7 Suspended 4'}},
    {name:'min7sus2',i:[0,2,7,10],o:{shortName:'m7 sus2',longName:'minor seventh Suspended 2\'nd'}},
    {name:'maj7sus2',i:[0,2,7,11],o:{shortName:'M7 sus2',longName:'Major 7 Suspended 2\'nd'}},
    {name:'majadd9',i:[0,4,7,14],o:{shortName:'add9',longName:'Major added 9'}},
    {name:'minadd9',i:[0,3,7,14],o:{shortName:'m add9',longName:'minor added 9'}},
    {name:'maj9',i:[0,4,7,11,14],o:{shortName:'M9',longName:'Major 9'}},
    {name:'min9',i:[0,3,7,10,14],o:{shortName:'m9',longName:'minor 9'}},
    {name:'minmaj9',i:[0,3,7,11,14],o:{shortName:'mMaj9',longName:'minor Major 9'}},
    {name:'majmin9',i:[0,4,7,10,14],o:{shortName:'9',longName:'Dominant 9'}}
];

//initialize all predefined chord types
for(i = 0; i < Chord.chordTypes.length; i++){
    
    var name = Chord.chordTypes[i].name;
    Chord.chords[name] = new Chord(name,Chord.chordTypes[i].i,Chord.chordTypes[i].o);
    
}

/*********************************************************************************************\
 ************************************** Utility functions ************************************
\*********************************************************************************************/

// Register the function f to run when the document finishes loading.
// If the document has already loaded, run it asynchronously ASAP.
function onLoad(f) {
    if (onLoad.loaded)f();
    else if (window.addEventListener){
        window.addEventListener("load", f, false);
    } else if (window.attachEvent){
        window.attachEvent("onload", f);
    }
}
onLoad.loaded = false;
onLoad(function() { onLoad.loaded = true; });

// Copies the properties of its second and subsequent arguments onto its first argument, 
// and returns the first argument.
function extend(o){
    
    for(var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        
        for(var prop in source){
            o[prop] = source[prop];
        }
    }
    
    return o;
}


/*********************************************************************************************\
 *************************************** Load audio files ************************************
\*********************************************************************************************/

//Load all audio files necessery as soon the page is done loading
onLoad(function(){
    
    Chord.audio.format = Modernizr.audio.ogg ? 'ogg' : Modernizr.audio.mp3 ? 'mp3' : false;
    
    if(!Chord.audio.format){
        throw 'Your browser does not support HTML5 audio. please update your browser.';
        return false;
    } else {
        Chord.audio.supported = true;
    }
    
    for(octave = Chord.config.range.lowestOctave; octave <= Chord.config.range.highestOctave; octave++){
        
        //indexes in the Chord.notes array
        var from = 0, to = Chord.notes.length - 1;
        
        //check if it's the first loop round, start loading by the index of the lowest note
        if(octave === Chord.config.range.lowestOctave){
            from = Chord.notes.indexOf(Chord.config.range.lowestNote);
        }
        
        //check if it's the last loop round, stop loading after the index of the highest note
        if(octave === Chord.config.range.highestOctave){
            to = Chord.notes.indexOf(Chord.config.range.highestNote);
        }
        
        //load all audio files
        for(i = from; i <= to; i++){
            
            var name = Chord.notes[i] + octave;
            Chord.audio.files[name] = new Audio();
            Chord.audio.files[name].src = Chord.audio.path + Chord.audio.format + '/' + name + '.' + Chord.audio.format;
            
            // add event listeners to audio objects
            // onplay add them to the Chord.audio.playing object
            // and remove them onended
            var o = Chord.audio.files[name];
            if (o.addEventListener){
                o.addEventListener("play", addToPlaying, false);
                o.addEventListener("ended", removeFromPlaying, false);
            } else if (o.attachEvent){
                o.attachEvent("onplay", addToPlaying);
                o.attachEvent("onended", removeFromPlaying);
            }   
        }// end of note loop    
    }// end of octave loop
    
    function addToPlaying(){
        Chord.audio.playing.push(this);
    }

    function removeFromPlaying(){
        for(i = o; i < Chord.audio.playing.length; i++){
            if(Chord.audio.playing[i] === this){
                Chord.audio.playing.splice(i,1)
                break;
            }
        }   
    }
        
})



