/*************************************************************************
 * 
 * server.js
 * 
 * This node.js file creates a local server on port 8880. 
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

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var port = process.env.PORT || 8880; 
app.use(bodyParser.json()); 
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(methodOverride('X-HTTP-Method-Override')); 
app.use(express.static('./frontend')); 
require('./app/routes')(app);
app.listen(port);               
             
console.log('Server is running on port ' + port);       
module.exports = app;    