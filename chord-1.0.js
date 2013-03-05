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
Chord.audio.path = '/chord.js/audio/'

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
        timeInterval:50,
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
 ************************************ Check for audio support ********************************
\*********************************************************************************************/

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.6.2',

    Modernizr = {},

    enableClasses = true,

    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  ,


    toString = {}.toString,    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName,



    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }


    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                                                    bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }



     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; 
     };


    setCss('');
    modElem = inputElem = null;

    ;(function(window, document) {
        var options = window.html5 || {};

        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        var supportsHtml5Styles;

        var expando = '_html5shiv';

        var expanID = 0;

        var expandoData = {};

        var supportsUnknownElements;

      (function() {
        try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
                    supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
                        (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
        } catch(e) {
          supportsHtml5Styles = true;
          supportsUnknownElements = true;
        }

      }());        function addStyleSheet(ownerDocument, cssText) {
        var p = ownerDocument.createElement('p'),
            parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

        p.innerHTML = 'x<style>' + cssText + '</style>';
        return parent.insertBefore(p.lastChild, parent.firstChild);
      }

        function getElements() {
        var elements = html5.elements;
        return typeof elements == 'string' ? elements.split(' ') : elements;
      }

          function getExpandoData(ownerDocument) {
        var data = expandoData[ownerDocument[expando]];
        if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
        }
        return data;
      }

        function createElement(nodeName, ownerDocument, data){
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
        }
        if (!data) {
            data = getExpandoData(ownerDocument);
        }
        var node;

        if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
        } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
        } else {
            node = data.createElem(nodeName);
        }

                                    return node.canHaveChildren && !reSkip.test(nodeName) ? data.frag.appendChild(node) : node;
      }

        function createDocumentFragment(ownerDocument, data){
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
        }
        data = data || getExpandoData(ownerDocument);
        var clone = data.frag.cloneNode(),
            i = 0,
            elems = getElements(),
            l = elems.length;
        for(;i<l;i++){
            clone.createElement(elems[i]);
        }
        return clone;
      }

        function shivMethods(ownerDocument, data) {
        if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
        }


        ownerDocument.createElement = function(nodeName) {
                if (!html5.shivMethods) {
              return data.createElem(nodeName);
          }
          return createElement(nodeName, ownerDocument, data);
        };

        ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
          'var n=f.cloneNode(),c=n.createElement;' +
          'h.shivMethods&&(' +
                    getElements().join().replace(/\w+/g, function(nodeName) {
              data.createElem(nodeName);
              data.frag.createElement(nodeName);
              return 'c("' + nodeName + '")';
            }) +
          ');return n}'
        )(html5, data.frag);
      }        function shivDocument(ownerDocument) {
        if (!ownerDocument) {
            ownerDocument = document;
        }
        var data = getExpandoData(ownerDocument);

        if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
          data.hasCSS = !!addStyleSheet(ownerDocument,
                    'article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}' +
                    'mark{background:#FF0;color:#000}'
          );
        }
        if (!supportsUnknownElements) {
          shivMethods(ownerDocument, data);
        }
        return ownerDocument;
      }        var html5 = {

            'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video',

            'shivCSS': (options.shivCSS !== false),

            'supportsUnknownElements': supportsUnknownElements,

            'shivMethods': (options.shivMethods !== false),

            'type': 'default',

            'shivDocument': shivDocument,

            createElement: createElement,

            createDocumentFragment: createDocumentFragment
      };        window.html5 = html5;

        shivDocument(document);

    }(this, document));

    Modernizr._version      = version;

    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                                                    (enableClasses ? ' js ' + classes.join(' ') : '');

    return Modernizr;

})(this, this.document);
/*yepnope1.5.4|WTFPL*/
(function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}})(this,document);
Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0));};

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





