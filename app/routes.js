/*************************************************************************
 * 
 * route.js
 * 
 * This node.js file defines APIs to enable communications between frontend and database. 
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

var sql = require('./models/connect');

module.exports = function(app) {
    // API to get players from the database.
    app.get('/players', function(req, res) {
        sql.playerQuery(function(list) {
            res.json({status: 200, content: list});
        });
    });
    
    // API to get bar chart data from the database.
    app.get('/bars', function(req, res) {
        sql.barQuery(function(list) {
            res.json({status: 200, content: list});
        });
    });
    
    // API to get to the index page.
    app.get('/', function(req, res) {
        res.sendfile('./frontend/team.html');
    });
    app.get('/team.html', function(req, res) {
        res.sendfile('./frontend/team.html');
    });
   
};
