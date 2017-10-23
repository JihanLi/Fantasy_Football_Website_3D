/*************************************************************************
 * 
 * db.js
 * 
 * This node.js file defines the basic information to access database. 
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

// Set the information to access database.
module.exports = {
        ip: 'MongoAWS-2.testdeploymongo.2788.mongodbdns.com:27000',
        name: 'admin',
        dbname: 'espn_api_data',
        players: 'players',
        bars: 'bars',
        username: 'jihanli',
        password: 'j123'
    };