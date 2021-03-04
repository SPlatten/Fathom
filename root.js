try{  
   /*Constants*/	
	var DATABASE_NAME			= "Fathom"
	   ,DELAY_BETWEEN_JOKES  	= 3
	   ,DELAY_TIMER_INTERVAL 	= 1000
	   ,JSON_FILE_SPEC			= "./json.txt"
	   ,PLACEHOLDER_TOTAL_JOKES	= "{TOTAL_JOKES}"
	   ,PLACEHOLDER_JOKE_NUMBER = "{JOKE_NUMBER}"
	   ,PLACEHOLDER_JOKE_TEXT	= "{JOKE_TEXT}"
	   ,PLACEHOLDER_PUNCHLINE	= "{JOKE_PUNCHLINE}"
	   ,TABLE_JOKES				= DATABASE_NAME + ".tblJokes"
	   ,TABLE_TYPES				= DATABASE_NAME + ".tblTypes"
    /*Array of jokes, populated when file is read*/	
	   ,aryJokes
	/*Cookies*/
       ,cookies  				= require("cookies")	
	/*Database manager*/
	   ,dbman     				= require("./svr/dbman.js")	
    /*Constant definitions*/
	   ,defs					= require("./svr/defs.js")
	/*Error Handler message display routine*/
	   ,eh						= require("./svr/err.js")	
    /*Load the File System module*/
	   ,fs	 					= require("fs")
	/*HTTP functionality*/
       ,http      				= require("http")	
	/*HTTP server*/
   	   ,httpsvr   				= require("./svr/httpsvr.js")	
	/*Info message display routine*/
	   ,info      				= require("./svr/info.js")
	/*MySQL helper class*/
	   ,mysql					= require("mysql")
	   ,mysqlBusDevPool, mysqlPool, objMySQL
	/*Operating System*/
       ,os						= require("os")	
    /*Path handling*/
	   ,path					= require("path")
	/*Session handling*/
       ,session					= require("sesh").session
	/*Socket IO*/
      ,socket					= require("socket.io")
	/*Punchline to last joke*/
	   ,strPunchline
	/*Server host name*/   
	   ,strServerHost
	/*This file name for error handling*/
	   ,strThisFile				= "root.js"
	/*URL*/
       ,url						= require("url");	
/**
 * Process the next type from the passed types object
 * Parameters:
 *	objTypes, types object to process
 *  intInsertID, optional insert ID for type
 */
function addTypeAndJokes(objTypes, intInsertID) {
 	if ( typeof objTypes != "object" ) {
		return;
   	}
	/*Find first or next iterator to process according to tiNext*/
	var objType, strType;
	for( strType in objTypes ) {
		if ( objTypes[strType].intInsertID == undefined ) {
			objType = objTypes[strType];
			objType.intInsertID = intInsertID;
			break;
		}
	}
	if ( objType == undefined ) {
	/*Nothing to do!*/
		return;
	}
	console.log("Processing type " + defs.GREEN + strType + defs.RESET
		+ " inserted with ID "
		+ defs.GREEN + objType.intInsertID + defs.RESET
		+ " inserting " + defs.GREEN + objType.aryJokes.length 
		+ defs.RESET + " jokes into database");
	/*Insert joke entries into database database*/
	for( var j in objType.aryJokes) {
 		var objJoke = objType.aryJokes[j]
		   ,strTypeSelect = "SELECT `id` FROM " + TABLE_TYPES + " WHERE "
				+ "`type`=?"
		   ,strJokeInsert = "INSERT INTO " + TABLE_JOKES + " ("
				+ "`id`, `type`, `setup`, `punchline`) VALUES ("
				+ "?, ?, ?, ?)";
		objMySQL.transaction(strJokeInsert, [objJoke['id']
											,objType.intInsertID
											,objJoke['setup']
											,objJoke['punchline']]
											,function(aryRows, aryFields) {
			process.stdout.write(".");
		});
	}		
}				   
/**             
 * Function:
 *  defaultHandler
 * Parameters:
 *  request, the client request
 *  response, the server response
 */       
function defaultHandler(request, response) {
	try{
		var contentTypesByExtension = {
			   ".css"  : "text/css"
	          ,".eot"  : "application/vnd.ms-fontobject .eot"
	          ,".gif"  : "image/gif"
	          ,".html" : "text/html"
	          ,".jpg"  : "image/jpeg"
	          ,".js"   : "application/javascript; charset=utf-8"
	          ,".otf"  : "application/octet-stream .otf .ttf"
	          ,".png"  : "image/png"}       
		   ,dtNow       = new Date()
	       ,dtTomorrow  = new Date()                                  
		   ,objValidPages = {"default":"/index.html"}
	       ,uri         = url.parse(request.url, true)        
	       ,objCookies  = new cookies(request, response)
	       ,strFilename = String(uri.pathname)
		   ,strFullPath, strRemoteAddr, strRemoteInfo;
		strHost = request.headers.host;       
		/*Set tomorrows date and build cookie options*/
	    dtTomorrow.setDate(dtTomorrow.getDate() + 1);
	    var objOptions = {expires:dtTomorrow, httpOnly:true};
	    if ( request.method == "GET" ) {
	        var strInfo = "";
      
	        if ( !request ) {
	          eh.msg("Not a valid request!");
	          return;
	        }
	        if ( request.headers['user-agent'] ) {
	  /*Display user agent information*/
	          var strAgent = request.headers['user-agent'], $ = {};
            
	          if ( /mobile/i.test(strAgent) ) {
				  $.mobile = true;
	          }
	          if ( /like Mac OS X/.test(strAgent) ) {
				  $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.
	                                       exec(strAgent)[2].replace(/_/g, '.');
				  $.iPhone = /iPhone/.test(strAgent);
	              $.iPad = /iPad/.test(strAgent);
	          }
	          if ( /Android/.test(strAgent) ) {
				  $.android = /Android ([0-9\.]+)[\);]/.exec(strAgent)[1];
	          }
	          if ( /webOS/.test(strAgent) ) {
				  $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(strAgent)[1];
	          }
	          if ( /(Intel|PPC) Mac OS X/.test(strAgent) ) {
				  $.mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.
	                               exec(strAgent)[2].replace(/_/g, '.') || true;
	          }        
	          if ( /Windows NT/.test(strAgent) ) {
				  $.windows = /Windows NT ([0-9\._]+)[\);]/.exec(strAgent)[1];
	          }
	          strInfo += "User Agent:" + defs.RESET + strAgent;
	          info.msg(strInfo);       
	        }
	/*Get the parameters from the URL*/
	        if ( uri.query ) {
				var strContentKey, strPage;
				if ( strContentKey == undefined ) {
	            	strContentKey = "/";
	          	}
	        }
	        if ( (strFilename == "/" + strThisFile || strFilename == "/") ) {
	/*Append default document*/
				strFilename += "index.html";
	        }
	        strInfo = "HTTP request" + defs.CYAN + " for:" + defs.RESET 
														   + strFilename;
	        info.msg(strInfo);
	        strFullPath = path.join(process.cwd(), strFilename);
	        strInfo = "Full path:" + defs.RESET + strFullPath;
	        info.msg(strInfo);
	/*Replace all backslashes with '/'*/
	        strFullPath = strFullPath.replace(/\\/g, "/");
    
	        if ( fs.statSync(strFullPath).isDirectory() ) {
	/*Does the path end with '/'?*/
	            if ( strFullPath[strFullPath.length -1] != "/" ) {
	/*No, append now*/
	                strFullPath += "/";
	            }
	/*Serve up default document*/
	            strFullPath += objValidPages['default'].substr(1);    
	        }
	        if ( strRemoteInfo != undefined  ) {
	            info.msg(strRemoteInfo);
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
	           	var contentType = contentTypesByExtension
				  									 [path.extname(strFullPath)]
			  	   ,headers = {};
				if ( contentType ) {
					headers["Content-Type"] = contentType;
			  	}
	/*Ensure placeholders are updated*/
				const objRndJoke = getRandomJoke();
				file = file.replace(PLACEHOLDER_TOTAL_JOKES, aryJokes.length);
				file = file.replace(PLACEHOLDER_JOKE_NUMBER, objRndJoke["idx"]);
				file = file.replace(PLACEHOLDER_JOKE_TEXT, objRndJoke["setup"]);
				file = file.replace(PLACEHOLDER_PUNCHLINE
								   ,objRndJoke["punchline"]);
			  	response.writeHead(200, headers);
			  	response.write(file, "binary");
			  	response.end();
			});
		});		
	} catch( ex ) {
		eh.msg({file:strThisFile
	         ,method:"defaultHandler"
	             ,ex:ex});
	}      
};	   
/**
 * Select a random joke from the remaining jokes, then remove the chosen joke
 * from the remaining jokes array
 */
function getRandomJoke() {
	var intIdx = Math.floor(Math.random() * aryJokes.length)
	   ,objJoke = aryJokes[intIdx];
    /*Remove the chosen joke from the array*/
    aryJokes.splice(intIdx, 1);
    /*Return chosen joke to caller*/
	objJoke["idx"] = intIdx;
    return objJoke;
}
/**
 * Import JSON file into database
 */
function importJSON() {
	/*Read the file json.txt*/
	fs.readFile(JSON_FILE_SPEC, "binary", function(err, file) {
		if( err ) {
			console.log(defs.RED + err + defs.RESET);
			return;
		}
		var strTypeInsert = "INSERT INTO " + TABLE_TYPES + " (`type`)"
				  + " VALUES (?)";		
	/*Translate file into a JavaScript array*/
		aryJokes = eval(file);
		console.log(defs.RED + "No Jokes, importing from file!" + defs.RESET);
	/*Display summary of file content*/
		console.log("Analysing file " + defs.GREEN + JSON_FILE_SPEC 
			+ defs.RESET);
 	    console.log("File contains " + defs.GREEN + aryJokes.length 
			+ defs.RESET + " jokes");
	    var intMaxLength = 0, objTypes = {};
		for( var j in aryJokes ) {
			var objJoke = aryJokes[j]
			   ,strType = objJoke["type"];
		    if ( typeof strType == "string" && strType.length > 0 ) {
				var intUsage = 0;
				if ( typeof objTypes[strType] == "object" ) {
					intUsage = objTypes[strType].intUsage;
				} else {
					objTypes[strType] = {"aryJokes":[],"intUsage":0};
				}
				objTypes[strType].intUsage++;
				if ( intMaxLength < strType.length ) {
					intMaxLength = strType.length;
				}
				objTypes[strType]['aryJokes'].push(objJoke);
		    }
		}
		console.log("The following types were discovered:");	

		for( var strType in objTypes ) {
	/*Insert type into database*/
			objMySQL.transaction(strTypeInsert, [strType]
								,function(objResult) {
				addTypeAndJokes(objTypes, objResult['insertId']);
			});
		}
	});
}
/**
 * Function:
 *  mariaDBconnectPrimtive
 *  
 * Parameters:
 *  intIdx, 0 = 3sungrp, 1 = 3sunbusdev 
 *  cbRoutine, callback to call on successful connection
 *  objParams, optional array of parameters to pass onto the callback 
 */        
function mariaDBconnectPrimtive(intIdx, cbRoutine, objParams) {
	try{	  
    	if ( !(mysql && mysql.createPool) ) {
      	  throw( "Cannot create mysql pool!" );
    	}
		var pool;
     
		if ( intIdx == 1 ) {
			pool = mysqlBusDevPool; 
		} else {
			pool = mysqlPool; 
		}
		if ( pool == undefined ) {
			pool = mysql.createPool({host:strServerHost
								    ,port:"3306"
								    ,user:"root"
							 	,password:"resuocra"
                                ,timezone:"utc"
                      ,multipleStatements:true
       								 ,max:1000
								   	 ,min:1
					   ,idleTimeoutMillis:defs.QUERY_TIMEOUT});      
		}
    	if ( pool && pool.getConnection ) {  
     	   pool.getConnection(function(errsts, conn) {
			   var resp = {};
			   if ( errsts ) {
				   resp['error'] = errsts;
				   eh.msg({file:strThisFile
					    ,method:"mariaDBconnectPrimtive"
					        ,ex:errsts});
				   return;
			   }
			   resp['state'] = "connected";
			   
			   if ( cbRoutine ) {
				   cbRoutine(conn, resp, objParams);
				   
				   if ( conn != undefined ) {
					   conn.release();
				   }
			   }
		   });
	   }
	   if ( intIdx == 1 ) {
		   mysqlBusDevPool = pool; 
	   } else {
		   mysqlPool = pool; 
	   }
   } catch(ex) {
	   eh.msg({file:strThisFile
		    ,method:"mariaDBconnectPrimtive"
		        ,ex:ex});
   }    
};
/**
 * Function:
 *  mysqlConnect
 *  
 * Parameters:
 *  cbRoutine, callback to call on successful connection
 *  objParams, optional array of parameters to pass onto the callback 
 */        
function mysqlConnect(cbRoutine, objParams) {
  mariaDBconnectPrimtive(0, cbRoutine, objParams);
};
/**
 * Function:
 *  sessionWrapper
 * Paramters:
 *  request, the client request
 *  response, the server response
 */       
function sessionWrapper(request, response) {
	session(request, response, function(request, response) {
	/*Deal with the request and response*/
	defaultHandler(request, response);    
  });
};
    /*Display the application start-up message*/
    console.log(defs.CLRSCR + defs.GREEN + 
"****************************************************************************");
    console.log(defs.YELLOW +
"   Fathom for NODE.js, version 1.00, PID: "
	  + process.pid);  
    console.log(
"   Written by Simon Platten of Syberdyne Systems Limited 2021/03/02");
    console.log(defs.GREEN + 
"****************************************************************************" +
defs.RESET);
	var dtNow = new Date()
	/*Find the external I/P address for this system*/
       ,objNIs = os.networkInterfaces();        
	for( var strName in objNIs ) {
    	var aryIFace = objNIs[strName];      
    	for( var i=0; i<aryIFace.length; i++ ) {
			var objNI = aryIFace[i];
       
			if ( objNI['internal'] == false && "IPv4".match(objNI['family']) ) { 
				strServerHost = objNI['address'];
        		break; 
			}      
		}
		if ( strServerHost !== undefined ) {
			break;
		}
	}
	if ( strServerHost === undefined ) {
	/*If we couldn't determine the external I/P address use the local address*/
		strServerHost = "";    
	}
	/*THE DATABASE IMPLEMENTATION REQUIRES A LOCAL INSTALLATION OF MARIADB OR
	  MYSQL, THE DATABASE IMPLEMENTATION NEEDS MORE WORK!*/
	/*Create database manager*/
	    objMySQL = new dbman.clsDBman("MySQL",  mysqlConnect, mysql, eh);
	/*Does database exist!*/
	var strSQL = "SELECT SCHEMA_NAME"
			   + " FROM INFORMATION_SCHEMA.SCHEMATA"
			   + " WHERE SCHEMA_NAME=?";
	objMySQL.transaction(strSQL, [DATABASE_NAME], function(aryRows, aryFields) {
		if ( aryRows.length == 0 ) {
	/*No, create database and tables now*/
			console.log(defs.RED + "Database doesn't exist" + defs.RESET);
			strSQL = "CREATE DATABASE IF NOT EXISTS " + DATABASE_NAME;
			objMySQL.transaction(strSQL, null, function(aryRows, aryFields) {
				console.log(DATABASE_NAME + "...Database created");
	/*Create database tables*/
				strSQL = "CREATE TABLE " + TABLE_JOKES + " ("
	  		 + "`id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',"
	  		 + "`type` INT UNSIGNED NOT NULL COMMENT 'Look up into table tblTypes',"
	  		 + "`setup` VARCHAR(128) NOT NULL COMMENT 'Joke question\n',"
	  	     + "`punchline` VARCHAR(128) NOT NULL COMMENT 'Joke punchline',"
	  	     + "PRIMARY KEY (`id`),"
		 + "UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);";
				objMySQL.transaction(strSQL, []
								    ,function(aryRows, aryFields) {
					console.log(TABLE_JOKES + "...Table created");
					strSQL = "CREATE TABLE " + TABLE_TYPES + " ("
		 + "`id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',"
	     + "`type` VARCHAR(16) NOT NULL COMMENT 'Type description',"
		 + "PRIMARY KEY (`id`),"
		 + "UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE,"
		 + "UNIQUE INDEX `type_UNIQUE` (`type` ASC) VISIBLE);";
		 			objMySQL.transaction(strSQL, []
						    		,function(aryRows, aryFields) {
						console.log(TABLE_TYPES + "...Table created");
						setTimeout(importJSON, 100);									
					});
				});
			});
		}
	});
	/*Listen for HTTP clients*/
	var httpServer = new httpsvr.clsHTTPsvr()
	   ,app = http.createServer(sessionWrapper);
	/*Link the socket to the http server*/
	io = socket.listen(app, {"log":false});        
	/*Start listening*/
  	info.msg("Listening on IP: " + defs.RESET 
    		  				     + strServerHost 
								 + ":" + defs.SCK_PORT);									 
	app.listen(defs.SCK_PORT);	
} catch( ex ) {
    /*Client side*/
    console.log("root.js: " + ex);
}