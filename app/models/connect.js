/*************************************************************************
 * 
 * connect.js
 * 
 * This node.js file enables the connection to the MongoDB database. 
 * 
 * Author: Jihan Li (Advanced Technology Group)
 * 
 * ------------------
 * ESPN CONFIDENTIAL
 * __________________
 * 
 *  [2015] - [2020] ESPN Incorporated 
 *  All Rights Reserved.
 * 
 * NOTICE:  All information contained herein is, and remains
 * the property of ESPN Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to ESPN Incorporated and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from ESPN Incorporated.
 * 
 **************************************************************************/

// Set the parameters for Mongoose.
var mongoose = require('mongoose');  
var db = require('../../config/db');
var opt = {
          user: db.username,
          pass: db.password,
          auth: {
              authdb: db.name
          }
      };
var url = 'mongodb://'+db.ip+'/'+db.dbname;
console.log(url);
var con = mongoose.createConnection(url, opt);  

module.exports = {
	// Search database for bar chart.
	barQuery: function(callback)
            {	
                var schema = new mongoose.Schema({});
                var collectionName = db.bars;
                var bars = con.model('Bar', schema, collectionName);
                bars.find(function(err, cons) {
                if (err) {
                  console.log(err);
                } else {
                  callback(cons);
                }
                });
            },
	
    // Search database for all players.
	playerQuery: function(callback)
            {	
                var schema = new mongoose.Schema({});
                var collectionName = db.players;
                var players = con.model('Player', schema, collectionName);
                players.find(function(err, cons) {
                if (err) {
                  console.log(err);
                } else {
                  callback(cons);
                }
                });
            }
	
}