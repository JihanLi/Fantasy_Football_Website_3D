/*************************************************************************
 * 
 * chart.js
 * 
 * This JavaScript file enables the interactivity of the 2D sentiment bar chart. 
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

// Define the canvas and its size.
var margin = {top:50, right:2, bottom:10, left:50};
var pidth = 500 - margin.left - margin.right;
var peight = 150 - margin.top - margin.bottom;
var svg = d3.select("#viz").append("svg")
            .attr("width", pidth + margin.left + margin.right)
            .attr("height", peight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")");
var pan = d3.select("#pan").append("svg")
            .attr("width", document.getElementById('pan').clientWidth)
            .attr("height", document.getElementById('pan').clientHeight)
            .append("g")
            .attr("transform", "translate("+20+","+20+")");

// Define the axes of the bar chart.
var x = d3.scale.ordinal()
    .rangeRoundBands([0, pidth], .3);
var y = d3.scale.linear()
    .range([peight, 0]);
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

// Define the bars.
var bars;

// Define the small info panel.
var tip = d3.selectAll("#tips");

// Define the transition time of animation.
var duration = 1500;
var delay = 500;
var t0,t1,t2;

// Define the container of the data.
var datas = [];
var cur = [], pre = []; // current data, previous data

// Define some parameters.
var start = 0, end = 0; // the time range of data
var currentBars = "rating1"; // the choice of the field to view


// Get data from database using Ajax.
$.get("/bars", function(stock) {

})
.done(function(data) 
{
    // Get the data successfully.
	if(data.status === 200) 
    {
        // Transform the data into a certain json format.
        var content = data.content;
        content.forEach(function(d) { 
            var temp = {}; 
            temp["date"] = d.date;  
            temp["rating1"] = +d.rating1;
            temp["rating2"] = +d.rating2;
            temp["status1"] = +d.status1;
            temp["status2"] = +d.status2;
            temp["event1"] = +d.event1;
            temp["event2"] = +d.event2;
            datas.push(temp); 
        });

        // Add axes, texts, rectangular selectors to the canvas.
        svg.append("g")
            .attr("class", "axis")
            .attr("id", "axisX")
            .attr("transform", "translate(0," + peight + ")");
        svg.append("g")
            .attr("class", "axis")
            .attr("id", "axisY");
        
        pan.append("text")
            .attr("x", 63)
            .attr("y", -10)
            .style("font-size","8px")
            .text("Expert");
        pan.append("text")
            .attr("x", 93)
            .attr("y", -10)
            .style("font-size","8px")
            .text("Crowd");
        pan.append("text")
            .attr("x", -10)
            .attr("y", 13)
            .style("font-size","8px")
            .text("Rating");
        pan.append("text")
            .attr("x", -10)
            .attr("y", 43)
            .style("font-size","8px")
            .text("Athletic Status");
        pan.append("text")
            .attr("x", -10)
            .attr("y", 73)
            .style("font-size","8px")
            .text("Recent Event");
        
        pan.append("rect")
            .attr("id", "rating1")
            .attr("class", "cirs")
            .attr("x", 65)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill-opacity', 1)
            .style("stroke", '#6E6E6E')
            .style("stroke-width", 3);
        pan.append("rect")
            .attr("id", "rating2")
            .attr("class", "cirs")
            .attr("x", 95)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill-opacity', 1)
            .style("stroke", '#6E6E6E')
            .style("stroke-width", 0);
        pan.append("rect")
            .attr("id", "status1")
            .attr("class", "cirs")
            .attr("x", 65)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill-opacity', 1)
            .style("stroke", '#6E6E6E')
            .style("stroke-width", 0);
        pan.append("rect")
            .attr("id", "status2")
            .attr("class", "cirs")
            .attr("x", 95)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill-opacity', 1)
            .style("stroke", '#6E6E6E')
            .style("stroke-width", 0);
        pan.append("rect")
            .attr("id", "event1")
            .attr("class", "cirs")
            .attr("x", 65)
            .attr("y", 60)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill-opacity', 1)
            .style("stroke", '#6E6E6E')
            .style("stroke-width", 0);
        pan.append("rect")
            .attr("id", "event2")
            .attr("class", "cirs")
            .attr("x", 95)
            .attr("y", 60)
            .attr("width", 20)
            .attr("height", 20)
            .attr('fill-opacity', 1)
            .style("stroke", '#6E6E6E')
            .style("stroke-width", 0);
        
        // Set the trigger of clicking the selectors.
        pan.selectAll(".cirs")
            .on('click', function() {		
                pan.selectAll(".cirs")
                    .style("stroke-width", 0);
                d3.select(this)
                    .style("stroke-width", 3);
            
                currentBars = this.id;
                barChart(1);
            });
        
        // Initialize the time range slider.
        sliding();
    }
})
// If no data is obtained, display error message.
.fail(function() {
    $("#pad").html("<p>Connection Failed!</p>");
});

// Change the data field according to the selector.
var selectBars = function(d) 
{ 
    var temp = d.rating1;
    switch(currentBars)
    {
        case "rating1":
            temp = d.rating1;
            break;
        case "rating2":
            temp = d.rating2;
            break;
        case "status1":
            temp = d.status1;
            break;
        case "status2":
            temp = d.status2;
            break;
        case "event1":
            temp = d.event1;
            break;
        case "event2":
            temp = d.event2;
            break;
    }
    return temp; 
};

// Change the heights of bars according to the selector.
var selectBarsY = function(d) 
{ 
    var temp = y(d.rating1);
    switch(currentBars)
    {
        case "rating1":
            temp = y(d.rating1);
            break;
        case "rating2":
            temp = y(d.rating2);
            break;
        case "status1":
            temp = y(d.status1);
            break;
        case "status2":
            temp = y(d.status2);
            break;
        case "event1":
            temp = y(d.event1);
            break;
        case "event2":
            temp = y(d.event2);
            break;
    }
    return temp; 
};

// Change the displayed heights of bars according to the selector.
var selectBarsPY = function(d) 
{ 
    var temp = peight - y(d.rating1);
    switch(currentBars)
    {
        case "rating1":
            temp = peight - y(d.rating1);
            break;
        case "rating2":
            temp = peight - y(d.rating2);
            break;
        case "status1":
            temp = peight - y(d.status1);
            break;
        case "status2":
            temp = peight - y(d.status2);
            break;
        case "event1":
            temp = peight - y(d.event1);
            break;
        case "event2":
            temp = peight - y(d.event2);
            break;
    }
    return temp; 
};

// Change the content of the small info panel according to the selector.
var displayTips = function(d) 
{ 
    var temp = d.rating1;
    switch(currentBars)
    {
        case "rating1":
            temp = d.rating1;
            break;
        case "rating2":
            temp = d.rating2;
            break;
        case "status1":
            temp = d.status1;
            break;
        case "status2":
            temp = d.status2;
            break;
        case "event1":
            temp = d.event1;
            break;
        case "event2":
            temp = d.event2;
            break;
    }
    var coordinates = d3.mouse(this);
    var cox = coordinates[0];
    var coy = coordinates[1];
    //console.log(cox+", "+coy);
    tip.html("<strong style='font-family:Verdana, Geneva, sans-serif;font-size:8px;color:white'>Date:</strong> <span style='font-family:Verdana, Geneva, sans-serif;font-size:8px;color:yellow'>" + d.date + "</span><br>" +
"<strong style='font-family:Verdana, Geneva, sans-serif;font-size:8px;color:white'>" + currentBars + ":</strong> <span style='font-family:Verdana, Geneva, sans-serif;font-size:8px;color:red'>" + temp + "</span>")
    .style("left", (cox+170) + "px")		
    .style("top", (coy-10) + "px");	
};

// Draw the bar chart and set the animations.
function barChart(forward)
{        		
        // Set the domains of axes.
        x.domain(cur.map(function(d) { return d.date; }));
        y.domain([0, d3.max(cur, selectBars)]);

        // Set transition time.
        t0 = svg.transition().duration(750);
        t1 = svg.transition().duration(duration/2);
        t2 = svg.transition().duration(duration/2);

        // Add animations to bars and axes.
        t2.selectAll(".bar")
            .attr("y", function(d) { return peight; })
            .attr("height", function(d) { return 0; });

        t0.selectAll("#axisX").call(xAxis);
        t1.selectAll(".barCurrent")
            .delay(function(d, i) { 
                // The delay time presents the visual effects of a cascade animation.
                var order = i * 30;
                if(forward == 1)
                    return order;
                if(pre.length > cur.length)
                {
                        order = (cur.length - i) * 30;
                }
                return order; 
            })
            .attr("x", function(d) { return x(d.date); })
            .attr("width", x.rangeBand());
        t0.selectAll("#axisY").call(yAxis);
        t1.selectAll(".barCurrent")
            .delay(function(d, i) { 
                var order = i * 30;
                if(forward == 1)
                    return order;
                if(pre.length > cur.length)
                {
                        order = (cur.length - i) * 30;
                }
                return order;
            })
            .attr("y", selectBarsY)
            .attr("height", selectBarsPY);				  
};

// Update the data within a new time range.
function updateData()
{
    svg.selectAll(".barCurrent")
         .attr("class", "bar");
    bars.data(cur)
         .attr("class", "barCurrent");
}

// Set the color scale by interpolation.
function color() 
{
    var colorScale = d3.scale.linear()
        .domain([0, 0.5, 1])
        .range(["blue", "white", "red"]);
    return colorScale;
};

// Change the colors of selectors according to the data of the latest time.
function changeColor(start, end)
{
    $( "#amount" ).val( datas[start].date + " - " + datas[end].date )
                  .css("color", "#B40431");
    pan.select("#rating1").attr("fill", function(){return color()((datas[end].rating1-60)/40);});
    pan.select("#rating2").attr("fill", function(){return color()((datas[end].rating2-60)/40);});
    pan.select("#status1").attr("fill", function(){return color()((datas[end].status1-60)/40);});
    pan.select("#status2").attr("fill", function(){return color()((datas[end].status2-60)/40);});
    pan.select("#event1").attr("fill", function(){return color()((datas[end].event1-60)/40);});
    pan.select("#event2").attr("fill", function(){return color()((datas[end].event2-60)/40);});
}

// Set the trigger of sliding bar and update the corresponding data.
function sliding() 
{
    // Set the initial parameters and the trigger for the sliding bar.
    $( "#slider-range" ).slider({
      range: true,
      min: 0,
      max: 122,
      values: [ 90, 122 ],
      slide: function( event, ui ) {
          
        // Change the data according to the new time range.
        start = ui.values[ 0 ];
        end = ui.values[ 1 ];
        changeColor(start, end);
        pre = cur;
        cur = datas.slice(start,end+1);
        updateData();
        
        // Perform the animation.
        barChart(0);
      }
    });

    // Set the triggers of showing the info panel when the mouse is over the bars.
    bars = svg.selectAll(".bar")
              .data(datas)
                .enter().append("rect")
              .attr("class", "bar")
              .attr("y", function(d) { return peight; })
              .attr("height", function(d) {  return 0; })
              .style("stroke", "#fff")
        .style("stroke-opacity", 1e-6)
        .on('mouseover', function(d) {		
                tip.transition()		
                .duration(100)		
                .style("display", "initial");
          })
        .on('mousemove', displayTips)
            .on('mouseout', function(d) {		
                tip.transition()		
                .duration(100)		
                .style("display", "none");	
            });

    // Initialize the data according to the initial time range.
    start = Number($( "#slider-range" ).slider( "values", 0 ));
    end = Number($( "#slider-range" ).slider( "values", 1 ));
    changeColor(start, end);
    cur = datas.slice(start,end+1);
    bars.data(cur)
        .attr("class", "barCurrent");
    
    // Perform the animation.
    barChart(0);
};