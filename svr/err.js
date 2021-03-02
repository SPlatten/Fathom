/**
 * File:
 *  err.js
 *  
 * Notes:
 *  Error message handler   
 *  
 * History:
 *  2013/09/15 Written by Simon Platten
 */
 var defs = require("./defs.js");
/**
 * Function:
 *  msg
 *  
 * Parameters:
 *  objError, object containing error information:
 *    file, the name of the file the error occurs in
 *    method, the name of the method the error occurs in
 *    line, the line number 
 *    ex, the exception or message
 *    socket, the socket to send the error to     
 */         
function msg(objError) {
  if ( !objError ) {
// Do nothing, no error object  
    return;
  }
  var dte = new Date(),
      strTimestamp = dte.toLocaleDateString() + " " + dte.toLocaleTimeString(),
      strMsg = strTimestamp + defs.RED + " ERROR" + defs.RESET;
  if ( typeof objError == "string" ) {
    strMsg += "\n" + objError;
  } else if ( typeof objError == "object" ) {
    if ( objError['file'] != undefined || objError['method'] != undefined ) {
      strMsg += " caught in ";
    
      if ( objError['file'] != undefined ) {
        strMsg += objError['file'] + ":"; 
      }
      if ( objError['method'] != undefined ) {
        strMsg += objError['method'] + ":"
      }
      if ( objError['line'] != undefined ) {
        strMsg += "line " + objError['line'] + ":"; 
      }
    }
    if ( objError['ex'] != undefined ) {
      strMsg += "\n";

      if ( objError['ex'].message ) {
        strMsg += objError['ex'].message;
      } else {
        strMsg += objError['ex'];
      }
    }
  }      
  console.error(strMsg);
  
  if ( objError['socket'] != undefined ) {
    objError['socket'].emit("error", strMsg);
    console.log("Error message sent to client");  
  } 
};
// Make publically available
exports.msg = msg;        