(function () {
    'use strict';
        
    if ( window.speechSynthesis === undefined ) {
     
        window.speechSynthesis = (function(){
            
            // primary patterns used in this section:
            // - customized module pattern
            // - customized bridge pattern
            
            var //
            _implementation = {},
            _api = {};
            
            // Implementation
            
            Object.defineProperty( _implementation, 'pending', {
                get : function () {
                    return _implementation.pendingQueue.length !== 0;
                },
                enumerable : true,
                configurable : true
            });
            
            _implementation.speaking = false;
            
            _implementation.paused = false;
            
            _implementation.currentlyPlaying = null;
            _implementation.pendingQueue = [];
            _implementation.audio = new Audio();
            
            _implementation.speechWorker = new Worker('speakWorker.js');
    
            _implementation.base64 = function( data ){
                var //
                BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                PAD = '=',
                ret = '',
                leftchar = 0,
                leftbits = 0,
                i,
                curr;
                for (i = 0; i < data.length; i += 1) {
                    leftchar = (leftchar << 8) | data[i];
                    leftbits += 8;
                    while (leftbits >= 6) {
                        curr = (leftchar >> (leftbits-6)) & 0x3f;
                        leftbits -= 6;
                        ret += BASE[curr];
                    }
                }
                if (leftbits === 2) {
                    ret += BASE[(leftchar&3) << 4];
                    ret += PAD + PAD;
                } else if (leftbits === 4) {
                    ret += BASE[(leftchar&0xf) << 2];
                    ret += PAD;
                }
                return ret;
            };
                             
            _implementation.parseWav = function ( wav ) {
                
                function readInt( i, bytes ) {
                    var //
                    ret = 0,
                    shft = 0;
                    while ( bytes ) {
                        ret += wav[i] << shft;
                        shft += 8;
                        i += 1;
                        bytes -= 1;
                    }
                    return ret;
                }
                
                if ( readInt( 20, 2 ) !== 1 ){
                    throw 'Invalid compression code, not PCM';
                }
                if ( readInt( 22, 2 ) !== 1 ){
                    throw 'Invalid number of channels, not 1';
                }
                
                return {
                    sampleRate: readInt( 24 , 4 ),
                    bitsPerSample: readInt( 34, 2 ),
                    samples: wav.subarray( 44 )
                };
                
            };
            
            _implementation.speak = (function(){
                
                _implementation.speechWorker.addEventListener('message', function ( event ) {
                
                    //var wav = _implementation.parseWav( event.data );
                    var //
                    wav = event.data,
                    base64 = _implementation.base64( wav ),
                    dataURI = 'data:audio/x-wav;base64,'+base64;
                    
                    _implementation.pendingQueue.push( dataURI );
                    
                    if ( _implementation.currentlyPlaying === null ){
                   
                        _implementation.speaking = true;
                        _implementation.currentlyPlaying = _implementation.pendingQueue.shift();
                        _implementation.audio.src = _implementation.currentlyPlaying;
                        _implementation.audio.play();
                    
                    }
                });
                
                _implementation.audio.addEventListener('ended', function () {
                   
                   _implementation.currentlyPlaying = null;
                   
                    if (_implementation.pending === false){
                        _implementation.speaking = false;
                    }
                   
                    if (
                        _implementation.paused ||
                        _implementation.pending === false
                    ){
                       return;
                    }
                   
                    _implementation.currentlyPlaying = _implementation.pendingQueue.shift();
                    _implementation.audio.src = _implementation.currentlyPlaying;
                    _implementation.audio.play();
                   
                });
                
                return function ( utterance ) {
                
                    _implementation.speechWorker.postMessage({
                        text : utterance.text,
                        args : {} // TODO: Support for pitch, volume, etc...
                    });
                
                };
                
            }());
            
            _implementation.cancel = function (){
              
                _implementation.pendingQueue = [];
                
                _implementation.audio.pause();
                
                _implementation.audio.src = '';
                
                _implementation.currentlyPlaying = null;
              
            };
            
            _implementation.pause = function (){
            
                if ( _implementation.paused ){
                    return;
                }
                
                _implementation.paused = true;
            
                _implementation.audio.pause();
            
            };
            
            _implementation.resume = function(){
            
                if ( !_implementation.paused ){
                    return;
                }
                
                _implementation.paused = false;
                
                _implementation.audio.play();
                    
            };
            
            // API ~ Implementation - Binding
            
            Object.defineProperty( _api, 'implementation', {
               value : _implementation,
               enumerable : false
            });
            
            // API
            
            // Attributes
        
            Object.defineProperties( _api, {
               
               'pending' : {
                    get :  function(){
                        return _api.implementation.pending;
                    },
                    enumerable : true
                },
               'speaking' : {
                    get :  function(){
                       return _api.implementation.speaking;
                    },
                    enumerable : true
                },
               'paused' : {
                    get :  function(){
                       return _api.implementation.paused;
                    },
                    enumerable : true
                }
            });
            
            // Methods
            
            Object.defineProperties( _api, {
            
                'speak' : {
                    value : _api.implementation.speak,
                    writable : false,
                    enumerable : true
                },
                'pause' : {
                    value : _api.implementation.pause,
                    writable : false,
                    enumerable : true
                },
                'resume' : {
                    value : _api.implementation.resume,
                    writable : false,
                    enumerable : true
                },
                'cancel' : {
                    value : _api.implementation.cancel,
                    writeable : false,
                    enumerable : true
                },
                'getVoices' : {
                    value : _api.implementation.getVoices,
                    writable : false,
                    enumerable : true
                }
            });
            
            // Export public API
            
            return _api;
            
        }());
     
    }
    
    
    if ( window.SpeechSynthesisUtterance === undefined ) {
        
        window.SpeechSynthesisUtterance = (function(){
            
            // Implementation
            var //
            _implementation,
            _api;
            
            // API
            
            var Factory = function ( text ) {
            
                if ( ! ( this instanceof Factory ) ) {
                    return new Factory();
                }
            
                this.text = text;
                
            };
            
            return Factory;
            
        }()); 
    }
}());