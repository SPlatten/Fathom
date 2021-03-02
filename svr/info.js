/**
 * File:
 *  info.js
 *  
 * Notes:
 *  Info message handler   
 *  
 * History:
 *  2013/10/12 Written by Simon Platten
 */
 var defs = require("./defs.js");
 /**
 * Function:
 *  msg
 *  
 * Parameters:
 *  strMsg, the message to display
 */         
function msg(strMsg) {
  var dte = new Date(),
      strMonth = String(dte.getMonth() + 1),
      strDay = String(dte.getDate()), 
      strTimestamp;
  if ( strMonth.length < 2 ) {
    strMonth = "0" + strMonth;
  }      
  if ( strDay.length < 2 ) {
    strDay = "0" + strDay;
  }      
  strTimestamp = dte.getFullYear() + "-" +
                 strMonth + "-" +
                 strDay + " " +
                 dte.toLocaleTimeString();
  if ( strMsg == undefined ) {
    return;
  }
  console.info(strTimestamp + " " + defs.CYAN + strMsg + defs.RESET); 
};
// Make publically available
exports.msg = msg;        