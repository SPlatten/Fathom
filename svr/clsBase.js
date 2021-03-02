/**
 * File:
 *  clsBase.js
 *  
 * Notes:
 *  This file contains the class 'clsBase' which is a base class containing
 *  basic functionality inherited by other classes.   
 *
 * Members:
 *  m_strClassName  The name of the class
 *     
 * Methods:
 *  clsBase         Constructor
 *  bind            Creates a binding to a class method
 *  className       Set or Get the class name 
 *  error           Used for reporting errors
 *  getAttribute    Returns the specified attribute from an element   
 *  getChild        Returns a child node
 *  getElementById  Returns the element associated with the specified id
 *  getElementFromEvent Returns the element associated with an event
 *  getTimestamp    Returns date and time stamp with milliseconds as string
 *  hasChildren     Returns the number of child nodes associated with element 
 *  isChildOf       Returns true or false if the el1 is a child of the el2
 *  listenForEvent  Adds an event listener
 *  optimize        Optimizes packed string  
 *  packFiles       Returns a string which is the result of the supplied files
 *  readFiles       Read an array of files into a single buffer 
 *  removeListener  Removes an event listener
 *  visibility      Sets or gets the visiblity state     
 *        
 * History:
 *  2013/09/21 Written by Simon Platten
 *
 * Constructor:
 *  clsBase
 */
var err = require("./err.js"),
    fs  = require("fs");

function clsBase( strClassName ) {
/** 
 * Method:
 *  bind
 *  
 * Parameters:
 *  method, the class method to bind
 *  
 * Returns:
 *  A callback to the class method
 */        
  this.bind = function( method ) {
    try{
      var objRef = this;  
      return function() {
        return method.apply( objRef, arguments );
      };    
    } catch( ex ) {
      this.error( "bind", ex );
    }
  };
/**
 * Method:
 *  className
 *  
 * Parameters:
 *  strClassName, optional, the name of the class
 *  
 * Returns:
 *  The name of the class
 */         
  this.className = function( strClassName ) {
    if ( strClassName !== undefined ) {
      m_strClassName = strClassName; 
    }
    return m_strClassName;
  };
/**
 * Method:
 *  error
 *   
 * Parameters:  
 *  strMethod, the method name where the error occurs
 *  ex, the exception raised
 *   
 * Returns:
 *  none
 */   
  this.error = function( strMethod, ex ) {  
    var strMsg = "";
    
    if ( m_strClassName !== undefined ) {
      strMsg += m_strClassName; 
    }
    if ( strMethod && strMethod.length ) {
      strMsg += "." + strMethod;
    }
    if ( strMsg.length > 0 ) {
      strMsg += ":\n";
    }   
    if ( ex == null || ex === undefined ) {
      strMsg += "Cannot report error as " + ex + " is invalid";
    } else {
      if ( ex.message ) {
        if ( ex.fileName ) {
          strMsg += "file : " +  ex.fileName + "\n"; 
        }
        if ( ex.lineNumber ) {
          strMsg += "line : " +  ex.lineNumber + "\n"; 
        }
        if ( ex.message ) {
          strMsg += "msg  : " +  ex.message+ "\n"; 
        }
      } else {
        strMsg += ex;
      }
    }
    err.errorMsg( strMsg );
  };
/**
 * Method:
 *  getAttribute
 *  
 * Parameters:
 *  el, the element to retrieve the identifier of
 *  strAttr, the attribute name to fetch 
 *  blnUseNS, optional, true to look up attribute in namespace
 *  strNS, optional, the name-space to use  
 *  
 * Returns:
 *  A string containing the value, null if operation could not be completed
 */        
  this.getAttribute = function( el, strAttr, blnUseNS, strNS ) {
    var strValue = null;
  
    try{  
      if ( el && strAttr ) {          
        if ( blnUseNS == true && el.getAttributeNS ) {      
          strValue = el.getAttributeNS( strNS, strAttr );
        } else if ( el.getAttribute ) {      
          strValue = el.getAttribute( strAttr );
        } else {      
          strValue = el[strAttr];
        }      
      }       
    } catch( ex ) {
// No error reporting required here!  
    }
    return strValue;
  };
/**
 * Method:
 *  getChild
 *  
 * Parameters:
 *  pEl, the parent element to inspect
 *  intIdx, the index of the child node to fetch  
 *  
 * Returns:
 *  The child node or null if not found
 */        
  this.getChild = function( pEl, intIdx ) {
    try{
      var intChildren; 
      if ( pEl && 
          (intChildren = this.hasChildren(pEl)) > 0 && 
          (intIdx < intChildren) ) {
        if ( pEl.childNodes ) {    
          return pEl.childNodes[intIdx];
        }     
        if ( pEl.children ) {    
          return pEl.children[intIdx];
        }     
      }
    } catch( ex ) {
      this.error( "getChild", ex );
    }
    return null;
  };
/** 
 * Method:
 *	getElementById
 *
 * Parameters:
 *	strID, the identifier associated with the element to get
 *	objLevel, optional document level reference.
 *	
 * Returns:
 *	null if not found or the element
 */
  this.getElementById = function( strID, objLevel ) {
    try{
      if ( document.getElementById ) {
        if ( objLevel ) {
          return objLevel.document.getElementById( strID );
        }
        return document.getElementById( strID );     
      } else if ( document.all ) {
        if ( objLevel ) {
          return objLevel.document.all[ strID ];
        }
        return document.all[ strID ];     
      }
    } catch( ex ) {
      //reportError( ex );
    }    
    return null;
  };
/** 
 * Method:
 *	getElementFromEvent 
 *
 * Parameters:
 *  evt, the event   
 *
 * Returns:
 *	null if not found or the element
 */
  this.getElementFromEvent = function( evt ) {
    if ( evt ) {
      if ( evt.target ) {
        return evt.target;
      } else if ( evt.srcElement ) {
        return evt.srcElement;    
      }
    }
    return null;
  };  
/**
 * Method:
 *  getTimestamp
 *
 * Parameters:
 *  lngOffset, optional offset in milliseconds
 *
 * Returns:
 *  Date and time stamp with milliseconds
 */
  this.getTimestamp = function( lngOffset ) {
    try{
// Get the current time  
      var now = new Date();
// Add on the repeat interval        
      var lngMS = now.getTime();
      
      if ( lngOffset !== undefined ) {
        lngMS += lngOffset;      
      }
      now.setTime( lngMS );
      var strTime = now.toLocaleString();
      
      var pos = strTime.lastIndexOf( ":" );
      
      if ( pos != -1 ) {
        strTime = strTime.substring( 0, pos + 3 );
      }
      return strTime + "." + now.getMilliseconds();
    } catch( ex ) {
      this.error( "getTimestamp", ex );
    }
    return "";
  };
/**
 * Method:
 *  hasChildren
 *  
 * Parameters:
 *  el, the element to test
 *  
 * Returns:
 *  0 if el has no child nodes or the number of child nodes
 */        
  this.hasChildren = function( el ) {
    try{
      if ( el.childNodes && el.childNodes.length ) {
// IE    
        return el.childNodes.length; 
      }
      if ( el.children && el.children.length ) {
// Everything else
        return el.children.length;    
      }    
    } catch( ex ) {
      this.error( "hasChildren", ex );
    }
    return 0;
  };  
/**
 * Method:
 *  isChildOf
 *  
 * Parameters:
 *  el1, the element to look for in el2
 *  el2, the parent element
 *  
 * Returns:
 *  true if el1 is a descendant of el2 or they are the same, false if not found.
 */         
  this.isChildOf = function( el1, el2 ) {
    try{
      if ( !el1 || !el2 ) {
// Either el1 or el2 is invalid    
        return false;
      }
      if ( el1 == el2 ) {
// These are the same 
        return true;
      }
      var intChildren = this.hasChildren(el2);    
      for( var i=0; i<intChildren; i++ ) {
        var childNode = this.getChild( el2, i );
        
        if ( childNode == el1 ) {
          return true;
        }
        if ( this.hasChildren(childNode) ) {
// This element has child nodes, search those
          if ( this.isChildOf( el1, childNode ) == true ) {
            return true;
          }              
        }
      }
    } catch( ex ) {
    	this.error( "isChildOf", ex );
    }
    return false;
  };
/**
 * Method:
 *  listenForEvent
 *  
 * Parameters:
 *  strEvent, the name of the event to listen to without the 'on' prefix
 *  cb, the callback routine ( use bind for class methods ). 
 *  el, optional the element to attach the event to, if not supplied
 *      then the listener will listen to the entire window.
 *  
 * Returns:
 *  none
 */            
  this.listenForEvent = function( strEvent, cb, el ) {
    try {
      if ( !cb ) {
        throw( "Missing callback for event" );
      }
      if ( !el || window.attachEvent ) {
        el = window;
      }
      if ( objAllEventListeners  ) {
// Is this event already installed on this object?
        for( var i=0; i<objAllEventListeners.length(); i++ ) {
          var objEvent = objAllEventListeners.peek(i);
          if ( objEvent.owner == this &&
               objEvent.event == strEvent ) {
// Yes, do nothing
            return;             
          }
        }                              
      }    
      if ( el.addEventListener ) {
        el.addEventListener( strEvent, cb, false );
      } else if ( el.attachEvent ) {
        el.attachEvent( "on" + strEvent, cb );
      }
      if ( objAllEventListeners == null ) {
        objAllEventListeners = new clsSTACK();
      }
      var objEvent = {};
      objEvent.owner = this;
      objEvent.event = strEvent;
      objAllEventListeners.push( objEvent );   
    } catch( ex ) {
      this.error( "listenForEvent", ex );
    }
  };
/**
 * Method:
 *  optimize
 *  
 * Parameters:
 *  strContent, the content to analyse and update
 *  
 * Returns:
 *  The modified content
 *  
 * This function replaces the local variables in a funciton with one letter
 * versions, it also creates an alias list for functions   
 */            
  this.optimize = function(strContent) {
    if ( strContent !== undefined 
      && strContent.length !== undefined 
      && strContent.length > 0 ) {
      var strFunction = "function", intP = 0,
          aryIgnore = ["break", "case", "catch", "continue", "debugger", 
                       "default", "delete", "do", "else", "false", "finally", 
                       "for", strFunction, "if", "in", "instanceof", "new", 
                       "null", "return", "switch", "this", "throw", "true", 
                       "try", "typeof", "undefined", "var", "void", "while", 
                       "with"];
      do {
// Look for an instance of 'function ' or 'function('       
        if ( (intP = strContent.indexOf(strFunction, intP)) >= 0 ) {
// Advance reference for next search
          var intStart = intP;
          intP += strFunction.length;
          
          if ( !(strContent[intP] == " "
              || strContent[intP] == "(") ) {
// This isn't a function or method, skip it!              
            continue;
          }
          var intO, intC;
// Find the next occurence of '('
          if ( (intO = strContent.indexOf("(", intP)) >= 0 &&
// Find the next occurence of ')'
               (intC = strContent.indexOf(")", intO)) >= 0 ) {
// Extract the parameters between the brackets
            var strParams = strContent.substring(++intO, intC).trim();
            var intOB, intCB;
            intOB = intCB = 0;
            intP = ++intC;
            
            if ( strParams.length > 0 ) {
// Split the parameters into an array
              var aryParams = strParams.split(",");                                                    
// Create an object containing the parameters
              var objParams = {};
              for( var x in aryParams ) {
                var strParam = aryParams[x].trim();
                objParams[strParam] = "";
              }
// Count the opening '{'
              intO = intP;
              for( var i=intP; i<strContent.length; i++ ) {
                if ( strContent[i] == "{" ) {                  
                  intOB++;
                } else if( strContent[i] == "}" ) {
                  intCB++;
                }
                if ( intOB == intCB ) {
// We have found the end of the function scope with matching {}
                  break;                
                }
              }
// Cut out the entire original function
              var strOriginal = strContent.substring(intStart, i + 1);
// Build an object using the terms with counts of occurences
// Look for whole words and object references               
              var aryMatches = strOriginal.match(/[a-zA-Z0-9.]+/g);
              objWords = {};   
              for( var x in aryMatches ) {
                var strTerm = aryMatches[x];
                var strWord = strTerm.replace(/[^a-zA-Z.\s]+/g, '');
                var blnIgnore = false;
                for( var t in aryIgnore ) {
                  if ( strTerm == aryIgnore[t] ) {
                    blnIgnore = true;
                    break;
                  }
                }
                if ( blnIgnore == true ) {
                  continue;
                }
                if ( strWord.trim().length == 0 ) {     
                  aryMatches.splice(x, 1);
                } else if ( objWords[strTerm] === undefined ) {
                  objWords[strTerm] = { "cnt"    : 0, 
                                        "offset" : i, 
                                        "scope"  : intOB };
                }
                if ( objWords[strTerm] !== undefined ) {
                  objWords[strTerm]['cnt']++;
                } 
              }
console.log( objWords );              
// Generate short variable names to replace the parameters
              var strParam = "a";
              
              for( var x in objParams ) {
// Does the parameter already exist?
                var aryMatches = null;                 
                do{
                  var strRegEx = "\\b" + strParam + "\\b";                
                  aryMatches = strOriginal.match(strRegEx);
                
                  if ( aryMatches == null ) {
                    objParams[x] = strParam;                  
                  }
// The suggested replacment parameter is already in use, try another
                  var intCode = strParam.charCodeAt(0) + 1;
                  strParam = String.fromCharCode(intCode);  
                } while( aryMatches != null );                                
              }                            
// Replace all 'whole word' occurrences of each parameter
              var strModified = strOriginal;
              
              for( var x in objParams ) {
// Make sure the parameters are clear of whitespace
                var strRegEx = new RegExp("\\b" + x + "\\b", "g");              
                strModified = strModified.replace(strRegEx, objParams[x]);  
              }
// Replace the original function with the modified function
              strContent = strContent.replace(strOriginal, strModified);                            
            }
          }
        }
      } while( intP >= 0 );  
    }
    return strContent;
  };  
/**
 * Method:
 *  packFiles
 *  
 * Parameters:
 *  strBuffer, the buffer to pack
 *  blnOptimise, optional, default is false, true to optimise buffer
 *  strDestFile, optional, the name of the file to write the packed results to  
 *  
 * Returns:
 *  The packed string
 *  
 * OPTIMISE FUNCTION IS NOT FINISHED YET!  
 */          
  this.packFiles = function( strBuffer, blnOptimise, strDestFile ) {
// HACK:REMOVE THE LINE BELOW 
return strBuffer;      
      if ( strDestFile !== undefined ) {      
        fs.writeFileSync(strDestFile, strBuffer);
        return strBuffer;
      }      
    var strPacked, strWord, strFunction = "function", intP = 0,
        objIgnore = {"break"      : 1
                    ,"case"       : 1
                    ,"catch"      : 1
                    ,"continue"   : 1
                    ,"debugger"   : 1
                    ,"default"    : 1
                    ,"delete"     : 1
                    ,"do"         : 1
                    ,"else"       : 1
                    ,"finally"    : 1
                    ,"for"        : 1
                    ,strFunction  : 1
                    ,"if"         : 1
                    ,"in"         : 1
                    ,"instanceof" : 1
                    ,"new"        : 1
                    ,"return"     : 1
                    ,"switch"     : 1
                    ,"this"       : 1
                    ,"throw"      : 1
                    ,"try"        : 1
                    ,"typeof"     : 1
                    ,"undefined"  : 1
                    ,"var"        : 1
                    ,"void"       : 1
                    ,"while"      : 1
                    ,"with"       : 1}, objWords = {};
    if ( blnOptimise === undefined ) {
      blnOptimise = false;
    }                    
    try{
      if ( strBuffer === undefined || strBuffer.length == 0 ) {
        throw("Nothing to pack!");
      }
// Now pack the contents
      var blnInComment, intSngQuotes, intDblQuotes, intSkip;        
      var bytLast, bytCur, bytPrev, bytNext;

      for( var intPass=1; intPass<=2; intPass++ ) {
        intSngQuotes = intDblQuotes = intSkip = 0;
        bytLast = bytPrev = bytCur = strPacked = strWord = "";
        blnInComment = false;
        
        for( var b=0; b<strBuffer.length; b++ ) {
          if ( intSkip ) {
            intSkip--;
            continue;
          }
          if ( b ) {
            bytLast = bytCur;
          }
          if ( bytCur != "" ) {
            bytPrev = bytCur;
          }
          bytCur = strBuffer.substr(b, 1);
  
          if ( b < strBuffer.length - 1 ) {
            bytNext = strBuffer.substr(b + 1, 1);
          } else {
            bytNext = ""; 
          }
          if ( blnInComment === false ) {
            if ( bytCur == "'" ) {
              intSngQuotes ^= 1;
            }
            if ( bytCur == "\"" && bytLast != "\\" ) {
              intDblQuotes ^= 1;
            }
          }                
          if ( intSngQuotes || intDblQuotes ) {
// We copy anything in the quotes to the buffer
            strPacked += bytCur;        
            continue;
          }
          if ( bytCur == "/" && bytNext == "*" ) {
            blnInComment = true;
          } else if ( bytCur == "*" && bytNext == "/" ) {
            blnInComment = false;
// Skip over the next two bytes          
            intSkip = 2;
            continue;
          } else if ( bytCur == "/" && bytNext == "/" ) {
// Skip over the next two bytes
            b += 2;
            do {
              bytCur = strBuffer.substr(b, 1);
            
              if ( bytCur === false || bytCur == "\n" ) {
                b--;
                break;
              }
              b++;
            } while(true);
            continue;        
          } else if ( bytCur == "\t" || bytCur == "\r" || bytCur == "\n" ) {
// Skip over whitespace          
            continue;          
          }
          if ( blnInComment === false ) {
// Not in a comment...
            if ( bytCur == " " &&
               !((bytPrev >= "0" && bytPrev <= "9")
              || (bytPrev >= "A" && bytPrev <= "Z")
              || (bytPrev >= "a" && bytPrev <= "z")) ) {
// The current byte is a space, the previous byte is not an alpha numeric so
// we can discard the space                 
              continue;                 
            }
            if ( bytCur == " " &&
                 !((bytNext >= "0" && bytNext <= "9")
                || (bytNext >= "A" && bytNext <= "Z")
                || (bytNext >= "a" && bytNext <= "z")) ) {
// The current byte is a space, the next byte is not an alpha numeric so
// we can discard the space
              continue;                 
            }
            if ( blnOptimise == true && intPass >= 2 ) {
// Are we currently processing a whole word, function, method or reference?          
              if ( (bytCur >= "a" && bytCur <= "z") 
               || (bytCur >= "A" && bytCur <= "Z")
               || (((bytCur >= "0" && bytCur <= "9") 
                  || bytCur == "." || bytCur == "_") 
                && ((bytPrev >= "a" && bytPrev <= "z")
                 || (bytPrev >= "A" && bytPrev <= "Z"))) ) {
                strWord += bytCur;     
              } else {
                if ( strWord.length > 0 && objIgnore[strWord] === undefined ) {
                  if ( objWords[strWord] === undefined ) {
                    objWords[strWord] = { "cnt" : 0 }; // Instance count
                  }                            
                  objWords[strWord]['cnt']++;
                  
                  if ( strPacked.length > 0 ) {
// Look back for the term 'var '
                    var blnFound = false, j = b - (strWord.length + 1);
                    var strVar = "var ";                  
                    
                    while( blnFound == false && j > 0 ) {
                      var c = strVar.length - 1;
                      
                      while( blnFound == false  
                          && strPacked[j] == strVar[c] ) {                          
                        if ( c == 0 ) {
                          blnFound = true;
                        } else {
                          j--;
                          c--;
                        }
                      }
                    }
                  }                  
                }
                strWord = "";
              }
            }
            strPacked += bytCur;        
          }                                                  
        }
        strPacked += "\0";
        
        if ( blnOptimise == false ) {
// No need for a second pass        
          break;
        }
        if ( intPass == 1 ) {
// We have now removed all comments and white space, next time we count words           
          strBuffer = strPacked;
// First pass is complete, remove any words with a count of 1
/*
          for( var strWord in objWords ) {
            if ( objWords[strWord]['cnt'] <= 1 ) {
              delete objWords[strWord];  
            }
          }
*/          
        }
      }        
// Split into lines so we can trim and root out the blanks      
      var aryLines = strPacked.split("\n");
      strPacked = "";
    
      for( var l=0; l<aryLines.length; l++ ) {
        var strLine = aryLines[l].trim();
      
        if ( strLine.length == 0 ) {
          continue;
        }
        strPacked += strLine;        
      }
// Make sure there are no additional nulls at the end of the string, as this can 
// invalidate the document        
      while( strPacked.length > 0 
          && strPacked[strPacked.length - 1] == '\0' ) {
        strPacked = strPacked.substr(0, strPacked.length - 1);
      }
/*
if ( blnOptimise == true ) {
// Sort the words object      
console.log("==============================================================");    
console.log(objWords);
console.log("==============================================================");
console.log(strPacked.substr(0, 1024));
}
*/
      if ( strDestFile !== undefined ) {      
        fs.writeFileSync(strDestFile, strPacked);
      }      
    } catch( ex ) {
      this.error( "packFiles", ex );
    }
    return strPacked;
  };
/**
 * Method:
 *  readFiles
 *  
 * Parameters:
 *  aryFiles, an array containing the full path of files to read
 *  
 * Returns:
 *  A single buffer containing all the files content
 */          
  this.readFiles = function( aryFiles ) {
    var strBuffer = "";
    try{
      if ( !(aryFiles && aryFiles.length > 0) ) {
        throw("No files to read!");
      }
      for( var f=0; f<aryFiles.length; f++ ) {
        var strFullPath = aryFiles[f];
        strBuffer += fs.readFileSync(strFullPath, "binary");
      }
    } catch( ex ) {
      this.error( "readFiles", ex );
    }
    return strBuffer;
  };
/**
 * Method:
 *  removeListener
 *  
 * Parameters:
 *  strEvent, the name of the event to remove without the 'on' prefix
 *  cb, the callback routine ( use bind for class methods ). 
 *  el, optional the element to attach the event to, if not supplied
 *      then the listener will listen to the entire window.
 *  
 * Returns:
 *  none
 */        
  this.removeListener = function( strEvent, cb, el ) {
    try{
      if ( !cb ) {
        throw( "Missing callback for event" );
      }
      if ( !el || window.detachEvent ) {
        el = window;
      }
      if ( el.removeEventListener ) {
        el.removeEventListener( strEvent, cb, false );  
      } else if ( el.detachEvent ) {
        el.detachEvent( "on" + strEvent, cb );    
      }
      if ( objAllEventListeners ) {
// Look for the event
        for( var i=0; i<objAllEventListeners.length(); i++ ) {
          var objEvent = objAllEventListeners.peek(i);
          if ( objEvent.owner == this &&
               objEvent.event == strEvent ) {
            objAllEventListeners.remove(i);
            break;
          }
        }          
      }
    } catch( ex ) {
      this.error( "removeListener", ex );
    }
  };
/**
 * Method:
 *  visibility
 *  
 * Parameters:
 *  el, the element to effect
 *  strState, optional, the state to set
 *  
 * Returns:
 *  The current visibility setting
 */        
  this.visibility = function( el, strState ) {
    var strAttr = "visibility";
  
    if ( el && el.setAttribute && strState ) {
      el.setAttribute( strAttr, strState );
    }
    return el.getAttribute( strAttr );
  };
// Initialise the object
  var m_strClassName = "clsBase";
  
  if ( strClassName === undefined || typeof strClassName !== "string" ) {
    throw("No class name specified!");
  }
  this.className(strClassName);
};
try {
// Make publically available
  exports.clsBase = clsBase;
  exports.clsBaseBuild = {"author"     : "Simon Platten",
                          "description": "Base class",
                          "version"    : 1.0,
                          "date"       : "2013-09-21"};
} catch(ex) {
// Do nothing, this is just so we can use the same script client side without
// warnings.
}