/**
 * File:
 *  dbman.js
 *  
 * Notes:
 *  This file contains the class clsDBman, it is a database manager / helper.
 *  Written to manage connections and service queues.
 *  
 * Requires node modules:
 *  mssql and/or mysql        
 *
 * Constants:
 *  MAX_TRANSACTION_ID, maximum transaction ID
 *  MIN_TRANSACTION_ID, minimum transaction ID 
 *  SERVICE_INTERVAL, service time interval in milliseconds
 *  STATE_INPROGRESS, transaction in progress 
 *  STATE_QUEUED, transactions waiting in queue
 *  STATE_COMPLETED, transaction completed
 *  STR_CALL, string constant, CALL statement prefix
 *  STR_INSERT, string constant, INSERT statement prefix
 *  STR_REPLACE, string constant, REPLACE statement prefix 
 *  STR_SELECT, string constant, SELECT statement prefix
 *  STR_UPDATE, string constant, UPDATE statement prefix
 *       
 * Members:
 *  maryobjTrans, array containing pending transactions 
 *  mcbConn, callback routine to establish connection with database
 *  mlngTranactionID, the next unique transaction ID  
 *  mobjstats, object for tracking various sql transactions
 *  mpackage, the package associated with the database 
 *  mstrClassName, class name string used for reporting
 *  mstrName, name assigned to database manager
 *  mstrThisFile, the name of this file   
 *     
 * Methods:
 *  blnIsDBmngr, returns true for valid class type checking
 *  cleanupQueue, cleans up the transaction queue removing completed items
 *  getStats, returns an object containing the statistical information 
 *  name, access method returns the name of the database manager  
 *  service, extracts one transaction from the queue and performs  
 *  transaction, connects to the database and executes transaction
 *     
 * History:
 *  2015/07/13 Written by Simon Platten
 */
/**
 * Constructor class
 * 
 * Parameters:
 *  strName, name to assign to this manager 
 *  cbConn, function to call to establish connection to database
 *  dbPackage, the package associated with the require statement
 *  eh, optional, instance of error reporting helper class    
 */               
function clsDBman(strName, cbConn, dbPackage, eh) {
  var T = this
     ,MAX_TRANSACTION_ID  = 9999
     ,MIN_TRANSACTION_ID  = 1 
     ,SERVICE_INTERVAL    = 30
     ,STATE_QUEUED        = 1
     ,STATE_INPROGRESS    = 2
     ,STATE_COMPLETED     = 3
     ,STR_CALL            = "CALL"
     ,STR_DELETE          = "DELETE"
     ,STR_INSERT          = "INSERT"
     ,STR_REPLACE         = "REPLACE" 
     ,STR_SELECT          = "SELECT"
     ,STR_UPDATE          = "UPDATE"
     ,maryobjTrans        = []
     ,mcbConn             = cbConn
     ,mlngTranactionID    = MIN_TRANSACTION_ID
     ,mobjstats           = {deletes:0
                            ,inserts:0
                            ,queries:0
                            ,replaces:0
                            ,storedprocs:0
                            ,updates:0}
     ,mpackage            = dbPackage 
     ,mstrClassName       = "clsDBman: "
     ,mstrName            = strName
     ,mstrThisFile        = "dbman.js";
     
  if ( typeof mcbConn != "function" ) {
    throw(mstrClassName + "No connection helper function supplied!"); 
  }
  //objMSSQLStats = fnDBstats("MS-SQL");
  //objMSSQLStats = fnDBstats("MariaDB");
/**
 * Class type verification routine, returns true to indicate class type
 */   
  T.blnIsDBmngr = function() {
    return true;
  };
/**
 * Cleans up transaction queue removing completed items and rebuilding queue
 */   
  T.cleanupQueue = function() {
    var aryQueue = [];
    
    for( var t=0; t<maryobjTrans.length; t++ ) {
      if ( maryobjTrans[t]['state'] != STATE_COMPLETED ) {
        aryQueue.push(maryobjTrans[t]);
      }
    }
    maryobjTrans = aryQueue;
  };
/**
 * Returns an object containing the statistical information
 */       
  T.getStats = function() {
    return mobjstats;
  }; 
/**
 * Access method returns the name of the database manager
 */   
  T.name = function() {
    return mstrName;
  };
/**
 * Extracts one item from the tranaction queue and performs
 */ 
  T.service = function() {  
//Anything in the queue?
    if ( maryobjTrans.length == 0 ) {
//No
      return;    
    }
//Find the next transaction waiting to be serviced
    while( maryobjTrans.length ) {
      try{
        var objTransaction = maryobjTrans.shift();

        if ( objTransaction && objTransaction['state'] != STATE_QUEUED ) {
//Transaction already in progress, look for another
          continue;
        }
//Perform the transaction      
        mcbConn(function(objConn) {
          var objTransaction; 
  
          if ( arguments && arguments.length >= 3 ) {
            objTransaction = arguments[2];
          }
          if ( objTransaction == undefined ) {
//No transaction, abort!
            eh.msg(mstrThisFile + " " + mstrName + 
                  ", No SQL transaction supplied!");
            return;
          }
          if ( objTransaction['state'] != STATE_QUEUED ) {
            return;
          }
//What type of transaction is this? Adjust the appropriate stats
          var strSQL = objTransaction['sql'].toUpperCase();
//Found a waiting transaction, change state
          objTransaction['state'] = STATE_INPROGRESS;
          
          if ( strSQL.substr(0, STR_CALL.length) == STR_CALL ) {
            mobjstats['storedprocs']++;
          }
          if ( strSQL.substr(0, STR_DELETE.length) == STR_DELETE ) {
            mobjstats['deletes']++;
          }
          if ( strSQL.substr(0, STR_INSERT.length) == STR_INSERT ) {
            mobjstats['inserts']++;
          }
          if ( strSQL.substr(0, STR_REPLACE.length) == STR_REPLACE ) {
            mobjstats['replaces']++;
          }
          if ( strSQL.substr(0, STR_SELECT.length) == STR_SELECT ) {
            mobjstats['queries']++;
          }
          if ( strSQL.substr(0, STR_UPDATE.length) == STR_UPDATE ) {
            mobjstats['updates']++;
          }
          if ( objTransaction['ps'] == true ) {
//Prepared statement
            if ( mpackage.PreparedStatement ) {
//MSSQL   
              var ps = new mpackage.PreparedStatement(objConn), objParams; 
//Any prepared statement parameters?
              if ( objTransaction['params'] 
                && objTransaction['params'].length ) {
                objParams = {};
                for( var p=0; p<objTransaction['params'].length; p++ ) {
                  var objParam = objTransaction['params'][p];
                  ps.input(objParam['name'], objParam['type']);
//Create the parameters with values                
                  objParams[objParam['name']] = objParam['value']; 
                }
              }
              ps.prepare(objTransaction['sql'], function(errsts) {
                if ( errsts ) {
                  console.log(objTransaction['sql']);
                  eh.msg(mstrThisFile + " " + mstrName + ", " + errsts); 
                  return;
                }
                ps.execute(objParams, function(errsts, aryRows) {        
                  if ( errsts ) {
                    console.log(objTransaction['sql']);
                    eh.msg(mstrThisFile + " " + mstrName + ", " + errsts);
                    return;
                  }
                  if ( aryRows && aryRows.length 
                    && objTransaction['cb'] != undefined ) {
                    objTransaction['cb'](aryRows);
                  }
                });            
              });                               
            }                  
          } else {
//Query
            var cbResults = function(ex, rows, fields) {
              if ( ex ) {
//Something wrong, report to console
                eh.msg(mstrThisFile + " " + mstrName + ", " + ex);
                return;
              }
              objTransaction['state'] = STATE_COMPLETED;
                                   
              if ( objTransaction['cb'] != undefined ) {
                objTransaction['cb'](rows, fields);                  
              }
            };            
            if ( objConn.query == undefined ) {
              var request = new mpackage.Request(objConn);
              request.query(objTransaction['sql'], cbResults);
            } else {        
              objConn.query(objTransaction['sql']
                           ,objTransaction['params'], cbResults);
            }                           
          }
        }, objTransaction);
//We have started the transaction, exit the service until next iteration    
        break;
      } catch( ex ) {
        eh.msg({file  :mstrThisFile
               ,method:"service"
               ,ex    :ex});
      }              
    }
//Update queue removing any completed transactions    
    T.cleanupQueue();                
  };    
/**
 * Queues a transaction 
 * 
 * Parameters:
 *  strSQL, the SQL containing the call to the stored procedure
 *  aryParams, optional, array of parameters to pass onto the stored proc.
 *  cbFun, optional, the function to call after the call is performed.
 *  blnPrepareStatement, optional, true to use prepared statement     
 */ 
  T.transaction = function(strSQL, aryParams, cbFun, blnPrepareStatement) {
//Validate parameters
    if ( strSQL == undefined || typeof strSQL != "string" ) {
      throw(mstrClassName + "SQL string must be supplied!");      
    }
    if ( aryParams != undefined && typeof aryParams != "object" 
      && aryParams.length == undefined ) {
      throw(mstrClassName + "Parameters must be an array!");
    }    
    if ( cbFun != undefined && typeof cbFun != "function" ) {
      throw(mstrClassName + "Callback must be a function!");
    }
//Add the transaction to the queue    
    maryobjTrans.push({id:mlngTranactionID
                     ,sql:strSQL
                 ,params:aryParams
                      ,cb:cbFun
                   ,state:STATE_QUEUED
                      ,ps:blnPrepareStatement});
//Increment unique transaction ID                          
    if ( mlngTranactionID++ > MAX_TRANSACTION_ID ) {
      mlngTranactionID = MIN_TRANSACTION_ID;
    }
  };
  if ( !(mcbConn && mpackage) ) {
    throw("Critical component missing from database manager initialisation!");
  }
//Install timer to service transaction queue
  setInterval(T.service, SERVICE_INTERVAL);  
};  
try {
// Make publically available
  exports.clsDBman = clsDBman;
  exports.clsDBmanBuild = {"author"     : "Simon Platten",
                           "description": "Database Manager",
                           "version"    : 1.0,
                           "date"       : "2015-07-13"};
} catch(ex) {
// Do nothing, this is just so we can use the same script client side without
// warnings.
}