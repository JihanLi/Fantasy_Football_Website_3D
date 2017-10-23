/*************************************************************************
 * 
 * player.js
 * 
 * This JavaScript file enables the interactivity of twit data interface for player.html. 
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

// Define the container of the twit data panel.
var container = document.getElementById('container');

// Define a variable to store the data.
var players = [];

// Define a number of indicators.
var rankPage = 1, newsPage = 1; // the current page number
var maxRank = 9, maxNews = 9; // the maximum page number
var found = false; // if a player is found or not during a search

// Avoid default mousedown event in this page.
$(".tweets").on('mousedown', function(event) {
  event.preventDefault();
});

// Press Enter button to trigger the search event.
$(document).keypress(function(e) {
    if ((e.keyCode || e.which) == 13) {
        $('.searchButton').trigger('click');
    }
});

// Get data from database using Ajax.
$.get("/players", function(player) {

})
.done(function(data) 
{
    // Get the data successfully.
    if(data.status === 200) 
    {
        // Initialize the data.
        players = data.content[0].players;
        var names = [];
        for(var cyI = 0; cyI < players.length; cyI++)
        {
            names.push(players[cyI].name);
        }
        eventTrigger();
        
        
        // If find a player when searching
        function updateTable(selected, playerName)
        {
            // Change the player list to that player.
            var disp = "";
            for(var cyI = 0; cyI < players.length; cyI++)
            {
                if(selected == players[cyI].group || selected == "All")
                {    
                    if(players[cyI].name == playerName)
                        disp += "<tr class='cols current'>";
                    else
                        disp += "<tr class='cols'>";
                    disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank+"</td><td>"+players[cyI].score+"</td><td>"+players[cyI].risk+"</td><td>"+players[cyI].sentiment+"</td>";
                    disp += "</tr>";
                }
                else if(selected == "RB/WR")
                {
                    if(players[cyI].group == "RB" || players[cyI].group == "WR")
                    {    
                        if(players[cyI].name == playerName)
                            disp += "<tr class='cols current'>";
                        else
                            disp += "<tr class='cols'>";
                        disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank+"</td><td>"+players[cyI].score+"</td><td>"+players[cyI].risk+"</td><td>"+players[cyI].sentiment+"</td>";
                        disp += "</tr>";
                    }
                }
            }
            $(".rankTable tbody").html(disp);
            
            // Refit the table into its container.
            var $table = $('.rankTable'),
                $headCells = $table.find('thead tr').children(),
                colWidth;
            colWidth = $headCells.map(function() {
                return $(this).width();
            }).get();
            $table.find('tbody tr').children().each(function(i, v) {
                $(v).width(colWidth[i]);
            });  
            
            // Reset event trigger of clicking list items.
            $('.cols').click(function(){
                $('.cols').removeClass('current');
                $(this).addClass('current');
                var text = this.firstChild.innerHTML;
                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    if(players[cyI].name == text)
                    {
                        $("#playerName").html(players[cyI].name);
                        $("#playerRank").html(players[cyI].rank);
                        $("#playerValue").html(players[cyI].score);
                        $("#playerRisk").html(players[cyI].risk);
                        $("#playerSent").html(players[cyI].sentiment);
                    }
                }  
            });
        }
        
        // Get twit data from SpredFast API.
        function updateTweets(tableSet)
        {
            $('<div />')
                .addClass('status')
                .html("")
                .prependTo(tableSet); 
            
            // Specify the stream and poller.
            var stream = new massrel.Stream('massrelevance/glee');
            var poller = stream.poller();
            poller.each(function(status) {
                var text = status.text;
                var screen_name = status.user.screen_name;
                var avatar_url = status.user.profile_image_url;

                // Display the twit data obtained.
                var html = '';
                html += '<a href="https://twitter.com/'+encodeURIComponent( screen_name )+'" class="avatar"><img src="'+avatar_url+'" /></a>';
                html += '<p class="text">'+text+'</p>';
                $('<div />')
                    .addClass('status')
                    .html(html)
                    .prependTo(tableSet); 
            });
            // Start polling.
            poller.start();
        }
        
        // Some special event triggers.
        function eventTrigger()
        {
            // Autocomplete the search box.
            $(function() {
                $("#search").autocomplete({
                  source: names,
                  minLength: 3,
                  select: function( event, ui ) {
                    document.getElementById("search").value = ui.item.value;
                    $('.searchButton').trigger('click');
                  },
                  open: function() {
                    $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
                  },
                  close: function() {
                    document.getElementById("search").value = "";
                    $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
                  }
                });
            });

            // Initialize the player list.
            var disp = "";
            for(var cyI = 0; cyI < players.length; cyI++)
            {   
                disp += "<tr class='cols'>";
                disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank+"</td><td>"+players[cyI].score+"</td><td>"+players[cyI].risk+"</td><td>"+players[cyI].sentiment+"</td>";
                disp += "</tr>";
            }
            $(".rankTable tbody").html(disp);

            // Fit the table into its container.
            var $table = $('.rankTable'),
                $headCells = $table.find('thead tr').children(),
                colWidth;
            colWidth = $headCells.map(function() {
                return $(this).width();
            }).get();
            $table.find('tbody tr').children().each(function(i, v) {
                $(v).width(colWidth[i]);
            });  

            $("#rankPage").html(rankPage);
            $("#newsPage").html(newsPage);

            // Update twits
            updateTweets('#stream1');
            updateTweets('#stream2');

            // Go to the previous page or next page.
            $("#rankL").click(function(){
                if(rankPage > 1)
                {
                    rankPage--;
                    $("#rankPage").html(rankPage);
                    updateTweets('#stream1');
                }
            });
            $("#rankR").click(function(){
                if(rankPage < maxRank)
                {
                    rankPage++;
                    $("#rankPage").html(rankPage);
                    updateTweets('#stream1');
                }
            });
            $("#newsL").click(function(){
                if(newsPage > 1)
                {
                    newsPage--;
                    $("#newsPage").html(newsPage);
                    updateTweets('#stream2');
                }
            });
            $("#newsR").click(function(){
                if(newsPage < maxNews)
                {
                    newsPage++;
                    $("#newsPage").html(newsPage);
                    updateTweets('#stream2');
                }
            });

            // Reset event trigger of clicking list items.
            $('.cols').click(function(){
                $('.cols').removeClass('current');
                $(this).addClass('current');
                var text = this.firstChild.innerHTML;
                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    if(players[cyI].name == text)
                    {
                        $("#playerName").html(players[cyI].name);
                        $("#playerRank").html(players[cyI].rank);
                        $("#playerValue").html(players[cyI].score);
                        $("#playerRisk").html(players[cyI].risk);
                        $("#playerSent").html(players[cyI].sentiment);
                    }
                }  
            });

            // Search a player in the database.
            $('.searchButton').click(function(){
                var inputValue = document.getElementById("search").value;
                document.getElementById("search").value = "";
                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    if(inputValue == players[cyI].name)
                    { 
                        $("#playerName").html(players[cyI].name);
                        $("#playerRank").html(players[cyI].rank);
                        $("#playerValue").html(players[cyI].score);
                        $("#playerRisk").html(players[cyI].risk);
                        $("#playerSent").html(players[cyI].sentiment);

                        var element = document.getElementById('group');
                        element.value = players[cyI].group;
                        updateTable(element.value, players[cyI].name);
                        found = true;
                    }
                }

                // If the player name is not found, display error message.
                if(!found)
                {
                    $("#playerName").html("No Record!");
                    $("#playerRank").html("No Record!");
                    $("#playerValue").html("No Record!");
                    $("#playerRisk").html("No Record!");
                    $("#playerSent").html("No Record!");

                    var element = document.getElementById('group');
                    element.value = "All";
                    updateTable(element.value, "");
                }
                else 
                {
                    found = false;
                }
            });

            // Change the player list when selection bar changes.
            var select = d3.select("#group");
            select.on("change",function() {
                $("#playerName").html("");
                $("#playerRank").html("");
                $("#playerValue").html("");
                $("#playerRisk").html("");
                $("#playerSent").html("");
                var e = document.getElementById("group");
                var selected = e.options[e.selectedIndex].value;
                updateTable(selected, "");
            });
        }
    }
})
// If no data is obtained, display error message.
.fail(function() {
    players = [];
    $(".rankTable tbody").html("Connection Failed!");
});