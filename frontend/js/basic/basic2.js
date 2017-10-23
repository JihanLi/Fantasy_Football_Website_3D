/*************************************************************************
 * 
 * basic2.js
 * 
 * This JavaScript file decides some css properties for player.html. 
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

window.onresize = function(event) 
{
    resizeDiv();
};

// Set the trigger of resizing the window.
$(document).ready(function(){resizeDiv();});

// Avoid the default mouse move event.
$(document).on('mousemove', function(event) {
  event.preventDefault();
});
$("#searchBar").on('mousemove', function(event) {
  event.stopPropagation();
});

// Resize some of the divs inside the window.
function resizeDiv() 
{
    var mainBody = document.getElementById("mainBody");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    mainBody.style.height = windowHeight +"px"; 
    
    var rightHeight = $("#right-half").height();
    var tableHeight = (rightHeight-150)*0.7;
    if(windowWidth > 1140)
    {
        tableHeight = (rightHeight-70)*0.7;
    }
    $(".rankTable tbody").css("height", tableHeight +"px"); 
};
