/**
 * File:
 *  httpsvr.js
 *  
 * Notes:
 *  This file contains the class 'clsHTTPsvr' which is a HTTP Server for the 
 *  Timekeeping interface.  
 *  
 * History:
 *  2015/11/30 Written by Simon Platten
 */
var base      = require("./clsBase.js")
   ,cookies   = require("cookies") 
   ,defs      = require("./defs.js")
   ,err       = require("./err.js")
   ,fs        = require("fs")
   ,http      = require("http")
   ,info      = require("./info.js")
   ,os        = require("os")    
   ,path      = require("path")
   ,qstring   = require("querystring")
   ,requestip = require("request-ip")  
   ,url       = require("url")
   ,util      = require("util")
   ,strDefaultDocument = "/index.html";            
 /**
 * Object:
 *  clsHTTPsvr
 * 
 * Members:
 *  maryHandlers   Array of handlers
 *        
 * Methods:
 *  addHandler      Adds a handler for a specific file
 *  defaultHandler  The default catch all request handler  
 */
util.inherits(clsHTTPsvr, base.clsBase);  
function clsHTTPsvr(strOverrideDefDoc) {
//Link this class with the base class      
  base.clsBase.call(this, "clsHTTPsvr");

  if ( strOverrideDefDoc !== undefined ) {
    strDefaultDocument = strOverrideDefDoc; 
  }    
  var maryHandlers = [],
      mblnVerbose  = true,
      mstrPath     = process.cwd();
/**
 * Function:
 *  addHandler
 *  
 * Parameters:
 *  strPathAndFile, the relative path and file name to handle
 *  cbFunction, the callback function to call to handle this file
 *  
 * Returns:
 *  none
 */          
  this.addHandler = function(strPathAndFile, cbFunction) {
    if ( strPathAndFile && String(cbFunction).substring(0, 8) == "function" ) {
//We have a valid file and a callback function, add the handler    
      maryHandlers.push({"file":strPathAndFile,
                          "cb"  :cbFunction});
    }
  };
/**
 * Function:
 *  defaultHandler
 *  
 * Parameters:
 *  request, the request object
 *  response, the response object
 *  
 * Returns:
 *  none
 */           
  this.defaultHandler = function(request, response) {
    try{
      var objCookies  = new cookies(request, response)
         ,dtNow = new Date()
         ,strRemoteAddr = requestip.getClientIp(request);         
//Build the remote address from information in the request object
      if ( strRemoteAddr && strRemoteAddr.length ) {
        var intLastColon = String(strRemoteAddr).lastIndexOf(":");
      
        if ( intLastColon > 0 ) {
          strRemoteAddr = String(strRemoteAddr).substr(intLastColon + 1).trim();
        }
        if ( strRemoteAddr.length > 1 ) {
          strRemoteInfo = "From:" + defs.RESET + strRemoteAddr;
        }
      }         
      if ( request.method == "POST" ) {
        var strBody = "";
        request.on("data", function(chunk) {
          strBody += chunk;
        });
        request.on("end", function() {
          console.log("Received posted data: " + strBody);

if ( objClients !== undefined ) {    
  console.dir(objClients);
}          
        });
      }
      var contentTypesByExtension = { ".html" : "text/html",
                                      ".css"  : "text/css",
                                      ".js"   : "text/javascript",
                                      ".jpg"  : "image/jpeg",
                                      ".png"  : "image/png" };    
      var uri         = url.parse(request.url, true),
          strFilename = String(uri.pathname),
          strFullPath = path.join(mstrPath, strFilename);
//uri.query holds JSON parameters
      if ( mblnVerbose == true ) {          
        info.msg("HTTP request for: " + strFilename);
      }
//Is there a handler for the request?
      for( var x in maryHandlers ) {
        var objHandler = maryHandlers[x];
        if ( strFilename.indexOf(objHandler.file) >= 0 ) {
//Call the handler for this file and abort the default handler        
          objHandler.cb(uri, path, fs, mstrPath, request, response);
          return;
        }
      }  
      fs.exists(strFullPath, function(exists) {
        if( !exists ) {
          response.writeHead(404, {"Content-Type": "text/plain"});
          response.write("404 Not Found\n");
          response.end();
          return;
        }
        if ( fs.statSync(strFullPath).isDirectory()) {
          strFullPath += strDefaultDocument;
        }
        fs.readFile(strFullPath, "binary", function(err, file) {
          if( err ) {        
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();
            return;
          }
          var headers = {};
          var contentType = contentTypesByExtension[path.extname(strFullPath)];
          
          if ( contentType ) {
            headers["Content-Type"] = contentType;
          }
          response.writeHead(200, headers);
          response.write(file, "binary");
          response.end();
        });
      });
    } catch( ex ) {
      err.msg({'file'   : 'httpsvr.js',
               'method' : 'defaultHandler',
               'ex'     : ex});
    }      
  }        
};
try {
//Make publically available
  exports.clsHTTPsvr = clsHTTPsvr;
  exports.clsHTTPsvrBuild = {"author"     : "Simon Platten",
                             "description": "HTTP Server Object",
                             "version"    : 1.0,
                             "date"       : "2013-09-18"};
} catch(ex) {
//Do nothing, this is just so we can use the same script client side without
//warnings.
}