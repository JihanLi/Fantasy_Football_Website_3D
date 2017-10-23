/*************************************************************************
 * 
 * position.js
 * 
 * This JavaScript file enables the interactivity of 3D interface for position.html. 
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

if (!Detector.webgl) Detector.addGetWebGLMessage();

// Define the container of the 3d scene.
var container = document.getElementById('container');
var width = container.offsetWidth;
var height = container.offsetHeight;

// Define the scene and the renderer.
var scene, raycaster;
var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
var duration = 750;
var delay = 500;
var pidth = document.getElementById('smallPanel').clientWidth;
var peight = document.getElementById('smallPanel').clientHeight;
var svg2 = d3.select("#smallPanel").append("svg")
            .attr("width", pidth)
            .attr("height", peight)
            .append("g");
var svg3 = d3.select("#infoPanel").append("svg")
            .attr("width",document.getElementById('infoPanel').clientWidth)
            .attr("height",document.getElementById('infoPanel').clientHeight)
            .append("g");

// Define 3d models including cylinders, texts, stars, field and obj loader.
var cylinders = [], cylindersOld = [], lines = [], lineCurrent = [], circles = [];
var mesh = [];
var stars, geometry, particles = 45000, shaders;
var trapezoid;
var rect, espnPlane, ffaPlane;
var loader;

// Define the basic properties of cylinders.
var sentColor = [0x0080FF, 0x298A08, 0xDF7401, 0xBDBDBD];
var lightColor = [0x00BFFF, 0x01DF3A, 0xFE9A2E, 0xF2F2F2];
var level = -30;
var veloMax = 2, veloMin = 1, veloH = [], veloHOld = [];

// Define the camera.
var aspect = width / height;
var camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
camera.position.set(1.47, 257.87, 908.17);

// Define controls.
var controls;
var mouseVec = new THREE.Vector2();

// Define a variable to store the data with different categories.
var players = [], playerRB = [], playerWR = [], playerQB = [], playerTE = [], playerK = [], playerRW = [], playerCurrent = [];

// Define a number of indicators.
var vizSize = 10; // the interval of player list
var interval = 0.5; // the speed of growth of lines
var isShow = false; // if the window size allows the presentation of the data panel or not
var isChosen = false; // if a cylinder or a player is selected or not
var isOver = false; // if the old cylinders are removed or not
var isRemoved = -1; // how many old cylinders are removed
var lineChanged = [], lineReached = [], lineCompleted = [], cylinderCompleted = 0; // the status of line and cylinder animation
var cylinderSelected = null; // the cylinder selected previously
var optionSelected = null; // the option selected previously in the selection bar 
var rangeSelected = -2; // the range selected previously in the selection bar 

// Set parameters of axes for the hawk-eye panel.
var x2 = d3.scale.linear()
    .range([32, pidth-15]);
var y2 = d3.scale.linear()
    .range([peight-55, 40]);
var xAxis2 = d3.svg.axis()
    .scale(x2)
    .orient("bottom");
var yAxis2 = d3.svg.axis()
    .scale(y2)
    .orient("left");
x2.domain([0, 20]);
y2.domain([0, 100]);


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
        for(var cyI = 0; cyI < players.length; cyI++)
        {
            switch(players[cyI].group)
            {
                case "RB":
                    playerRB.push(players[cyI]);
                    playerRW.push(players[cyI]);
                    break;
                case "WR":
                    playerWR.push(players[cyI]);
                    playerRW.push(players[cyI]);
                    break;
                case "QB":
                    playerQB.push(players[cyI]);
                    break;
                case "TE":
                    playerTE.push(players[cyI]);
                    break;
                case "K":
                    playerK.push(players[cyI]);
                    break;
            }
        }
        
        init();
        animate();
        infoPresenter();
        
        
        
        // Initialize all the models.
        function init() 
        {
            // Initialize the scene.
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x000000, 0.0003);

            // Add lights to the scene.
            scene.add(new THREE.AmbientLight(0xaaaaaa));
            var directLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directLight.position.set(0, 100, 100);
            directLight.target.position.set(0, 0, 0);
            directLight.shadowCameraVisible = false;
            directLight.castShadow = true;
            directLight.shadowDarkness = 0.5;          
            scene.add(directLight);

            var pointLight = new THREE.PointLight(0xffffff, 0.8);
            pointLight.position.set(223, 0, 500);
            scene.add(pointLight); 

            // Add raytracer to the scene.
            raycaster = new THREE.Raycaster();

            // Set the parameters of renderer.
            renderer.setClearColor(0x2E2E2E);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(width, height);
            renderer.autoClear = true;
            renderer.shadowMapEnabled = true;
            renderer.shadowMapSoft = true;
            renderer.shadowCameraNear = 3;
            renderer.shadowCameraFar = camera.far;
            renderer.shadowCameraLeft = -0.5;
            renderer.shadowCameraRight = 0.5;
            renderer.shadowCameraTop = 0.5;
            renderer.shadowCameraBottom = -0.5;
            renderer.shadowCameraFov = 50;
            renderer.shadowMapBias = 0.0039;
            renderer.shadowMapDarkness = 0.5;
            renderer.shadowMapWidth = 1024;
            renderer.shadowMapHeight = 1024;
            container.appendChild(renderer.domElement);

            // Initialize controls. 
            controls = new THREE.OrbitControls(camera, container);
            controls.target = new THREE.Vector3(0, 0, 0);
            controls.minDistance = 10;
            controls.maxDistance = 1000;
            controls.zoomSpeed = 0.8;
            controls.maxPolarAngle = Math.PI/2; 
            controls.noPan = true;
            controls.update();

            // Initialize stars.
            starGenerator();
            
            // Initialize the football field.
            fieldGenerator();
                
            // Add event listeners to the container.
            window.addEventListener('resize', onWindowResize, false);
            container.addEventListener( 'mousedown', onContainerMouseDown, false );
            container.addEventListener( 'mousemove', onContainerMouseMove, false );
            document.getElementById('smallPanel').addEventListener( 'mousedown', onPanelMouseDown, false );
        }
        
        // Generate stars.
        function starGenerator()
        {
            // Define external parameters for shaders.
            var attributes = {
				size: {type: 'f', value: null},
				customColor: {type: 'c', value: null}
			};

			var uniforms = {
				color: {type: "c", value: new THREE.Color( 0xffffff )},
				texture: {type: "t", value: THREE.ImageUtils.loadTexture( "source/star.jpg" )}
			};

            // Define the shaders.
			shaders = new THREE.ShaderMaterial( {
				uniforms: uniforms,
				attributes: attributes,
				vertexShader: document.getElementById( 'vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
				blending: THREE.AdditiveBlending,
				depthTest: true,
				transparent: true
			});
  
            // Define the shape, color, positions and material of stars.
            geometry = new THREE.BufferGeometry();
            var radius, phi, theta;
            var positions = new Float32Array( particles * 3 );
            var values_color = new Float32Array( particles * 3 );
			var values_size = new Float32Array( particles );
            
			for( var v = 0; v < particles; v++ ) {

				values_size[v] = 10*Math.random()+10;
                
                radius = (Math.random() * 0.2 + 0.8) * 1500;
                phi = 2 * Math.random() * Math.PI;
                theta = Math.acos(2 * Math.random() - 1.0);
				positions[v * 3 + 0] = radius*Math.sin(theta)*Math.cos(phi);
				positions[v * 3 + 1] = radius*Math.sin(theta)*Math.sin(phi);
				positions[v * 3 + 2] = radius*Math.cos(theta);

				values_color[ v * 3 + 0 ] = 1;
				values_color[ v * 3 + 1 ] = 1;
				values_color[ v * 3 + 2 ] = 1;
			}

            // Initialize the external parameters.
			geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
			geometry.addAttribute( 'customColor', new THREE.BufferAttribute( values_color, 3 ) );
            geometry.addAttribute( 'size', new THREE.BufferAttribute( values_size, 1 ) );

            // Add stars to the scene.
            stars = new THREE.PointCloud(geometry, shaders);
            scene.add(stars);
        }
        
        // Generate the football field.
        function fieldGenerator()
        {
            // Generate the trapezoid base of the field.
            trapezoid = new THREE.Geometry();

            trapezoid.vertices.push(
                new THREE.Vector3(-178, -30, -313),
                new THREE.Vector3(178, -30, -313),
                new THREE.Vector3(178, -30, 313),
                new THREE.Vector3(-178, -30, 313),
                new THREE.Vector3(-198, -50, -333),
                new THREE.Vector3(198, -50, -333),
                new THREE.Vector3(198, -50, 333),
                new THREE.Vector3(-198, -50, 333)
            );

            trapezoid.faces.push(new THREE.Face3(0, 1, 2));
            trapezoid.faces.push(new THREE.Face3(0, 2, 3));
            trapezoid.faces.push(new THREE.Face3(4, 5, 6));
            trapezoid.faces.push(new THREE.Face3(4, 6, 7));
            trapezoid.faces.push(new THREE.Face3(0, 4, 3));
            trapezoid.faces.push(new THREE.Face3(3, 4, 7));
            trapezoid.faces.push(new THREE.Face3(3, 7, 2));
            trapezoid.faces.push(new THREE.Face3(2, 7, 6));
            trapezoid.faces.push(new THREE.Face3(2, 6, 1));
            trapezoid.faces.push(new THREE.Face3(1, 6, 5));
            trapezoid.faces.push(new THREE.Face3(1, 5, 0));
            trapezoid.faces.push(new THREE.Face3(0, 5, 4));

            trapezoid.faceVertexUvs[0] = [];
            for(var i = 0; i <= 10; i+=2)
            {
                trapezoid.faceVertexUvs[0].push([
                  new THREE.Vector2(0, 1),
                  new THREE.Vector2(0, 0),
                  new THREE.Vector2(1, 1)
                ]);
                trapezoid.faceVertexUvs[0].push([
                  new THREE.Vector2(1, 1),
                  new THREE.Vector2(0, 0),
                  new THREE.Vector2(1, 0)
                ]);
            }
            trapezoid.computeFaceNormals();
            
            // Add textures to the base.
            var soil = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('source/soil.png')});
            rect = new THREE.Mesh(trapezoid, soil);
            rect.overdraw = true;
            
            // Add logos to the base.
            var espnLogo, ffaLogo, espnMat, ffaMat;
            espnLogo = THREE.ImageUtils.loadTexture( "source/ESPNUK.png" );
            espnLogo.wrapS = THREE.RepeatWrapping; 
            espnLogo.wrapT = THREE.RepeatWrapping;
            
            ffaLogo = THREE.ImageUtils.loadTexture( "source/FFALogo.png" );
            ffaLogo.wrapS = THREE.RepeatWrapping; 
            ffaLogo.wrapT = THREE.RepeatWrapping;

            espnMat = new THREE.MeshLambertMaterial({ map : espnLogo });
            espnMat.transparent = true;
            espnPlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 15), espnMat);
            espnPlane.material.side = THREE.DoubleSide;
            espnPlane.position.x = -108;
            espnPlane.position.y = -40;
            espnPlane.position.z = 324;
            espnPlane.rotation.x = -Math.PI/4;
            
            ffaMat = new THREE.MeshLambertMaterial({ map : ffaLogo });
            ffaMat.transparent = true;
            ffaPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 20), ffaMat);
            ffaPlane.material.side = THREE.DoubleSide;
            ffaPlane.position.x = 38;
            ffaPlane.position.y = -40;
            ffaPlane.position.z = 324;
            ffaPlane.rotation.x = -Math.PI/4;

            // Load the obj model and its textures for the football field.
            var onProgress = function (xhr) {
                if ( xhr.lengthComputable ) {
                    var percentComplete = xhr.loaded / xhr.total * 100;
                    console.log(Math.round(percentComplete, 2) + '% downloaded');
                }
            };
            var onError = function (xhr) {
            };

            THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

            loader = new THREE.OBJMTLLoader();
            loader.load('source/field/nfl_football_field2.obj', 'source/field/nfl_football_field2.mtl', function(object) 
            {
                object.rotation.y = Math.PI / 2;
                object.position.y = level;
                object.scale.set(70, 70, 70);
                
                object.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.receiveShadow = true;
                    }
                } );
                
                // Add all models to the scene in one time.
                scene.add(object);
                scene.add(rect);
                scene.add(espnPlane);
                scene.add(ffaPlane);
            }, onProgress, onError);
        }
        
        // Generate cylinders for each position.
        function cylinderGenerator(minR)
        {
            // Reset all parameters.
            refreshAll();
            isOver = false;
            
            for(var cyI = 0; cyI < mesh.length; cyI++)
            {
                scene.remove(mesh[cyI]);
                scene.remove(lines[cyI]);
                scene.remove(circles[cyI]);
            }
            cylindersOld = cylinders;
            veloHOld = veloH;
            cylinders = [];
            lines = [];
            circles = [];
            mesh = [];
            veloH = [];
            var disp = "";
            
            // Start drawing historical circles.
            var listSize = (playerCurrent.length < minR+vizSize)?playerCurrent.length:minR+vizSize;
            var tempPlayers = [];
            var cirRad = 5,
                cirMat = new THREE.LineBasicMaterial({color: 0xFFFF00, linewidth: 1}),
                cirGeo = new THREE.CircleGeometry(cirRad, 64);
            cirGeo.vertices.shift();
            
            for(var cyI = minR; cyI < listSize; cyI++)
            {
                 // Set parameters for each cylinder.
                tempPlayers.push(playerCurrent[cyI]);
                var colorIdx = 3;
                switch(playerCurrent[cyI].sentiment)
                {
                    case "pos":
                        colorIdx = 2;
                        break;
                    case "mid":
                        colorIdx = 1;
                        break;
                    case "neg":
                        colorIdx = 0;
                        break;
                }
                cylinders.push(new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1, 50, 50, false), new THREE.MeshLambertMaterial({ color: sentColor[colorIdx]})));
                var index = cyI-minR;
                cylinders[index].index = cyI;
                cylinders[index].scale.y = 0;
                cylinders[index].position.x += (playerCurrent[cyI].risk[1]-10)*150/10;
                cylinders[index].position.z += (80-playerCurrent[cyI].score[1])*200/20;
                //cylinders[index].position.z += (50-playerCurrent[cyI].rank[1])*200/50;
                cylinders[index].position.y = level-1;
                cylinders[index].overdraw = true;
                cylinders[index].castShadow = true;
                
                // Define a random speed of increasing the height of a cylinder.
                veloH.push((Math.random()* (veloMax - veloMin)) + veloMin);
                
                var cir = new THREE.Line(cirGeo, cirMat);

                cir.position.set((playerCurrent[cyI].risk[0]-10)*150/10, level+1, (80-playerCurrent[cyI].score[0])*200/20);
                //cir.position.set((playerCurrent[cyI].risk[0]-10)*150/10, level+1, (50-playerCurrent[cyI].rank[0])*200/50);
                cir.rotation.x = Math.PI / 2;
                circles[index] = cir;
                
                // Generate texts under the cylinders. The canvas should be transparent.
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                context.font = "Bold 30px Arial";
                context.fillStyle = "#F2F5A9";
                context.fillText(playerCurrent[cyI].name, 50, 70, 200);
                var texture = new THREE.Texture(canvas) 
                texture.needsUpdate = true;

                var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
                material.transparent = true;

                mesh[index] = new THREE.Mesh(new THREE.PlaneBufferGeometry(canvas.width/5, canvas.height/5), material);
                mesh[index].position.set(cylinders[index].position.x,level,cylinders[index].position.z+15);  
                
                // Display the player list.
                disp += "<tr class='cols'>";
                disp += "<td>"+playerCurrent[cyI].name+"</td><td>"+playerCurrent[cyI].group+"</td><td>"+playerCurrent[cyI].rank[1]+"</td><td>"+playerCurrent[cyI].score[1]+"</td><td>"+playerCurrent[cyI].risk[1]+"</td><td>"+playerCurrent[cyI].sentiment+"</td>";
                disp += "</tr>";
            }
            
            // Refit the table into its container.
            $(".rankTable tbody").html(disp);
            var $table = $('.rankTable'),
            $headCells = $table.find('thead tr').children(),
            colWidth;
            colWidth = $headCells.map(function() {
                return $(this).width();
            }).get();
            $table.find('tbody tr').children().each(function(i, v) {
                $(v).width(colWidth[i]);
            });  
            
            // Refresh circles in the hawk-eye panel.
            svg2.selectAll(".node2").remove();
            var node2 = svg2.selectAll(".node2")
            .data(tempPlayers)
            .enter().append("circle")
            .attr("class","node2")
            .attr("cx", function(d) { return d.risk[1]*110/20+34; })
            .attr("cy", function(d) { return (100-d.score[1])*200/40+50; })
            //.attr("cy", function(d) { return (100-d.rank[1])*200/100+50; })
            .attr("r", 5)
            .attr('fill', "white");
        node2.append("title")
            .text(function(d){return d.name;});
            
            // Reset event trigger of clicking the circles.
            svg2.selectAll(".node2")
                .on('click', function() {	
                    refreshAll();
                    d3.select(this).attr('fill', "#FF8000");
                    isChosen = true;
                    var text = d3.select(this)[0][0].firstChild.innerHTML;
                    for(var cyI = 0; cyI < cylinders.length; cyI++)
                    {
                        if(playerCurrent[cylinders[cyI].index].name == text)
                        {
                            cylinderSelected = cylinders[cyI];
                            var prevIdx = cylinderSelected.index;
                           
                            triggerDisplay(prevIdx, true);
                        }
                    }
                
                    d3.selectAll(".cols").each(
                        function(e, i){
                            if(this.firstChild.innerHTML == text)
                            {
                                $(this).addClass('current');
                                var w = $(".rankTable tbody");
                                var motion = (i-5)*$(this).height();
                                if(motion < 0)
                                    motion = 0;
                                else if(i > $('.cols').length-6)
                                    motion = ($('.cols').length-1)*$(this).height();
                                w.animate({scrollTop: motion}, 500);
                            }
                        }
                    );
                });
            
            // Reset event trigger of clicking list items.
            $('.cols').click(function(){
                refreshAll();	
                $(this).addClass('current');
                isChosen = true;
                var text = this.firstChild.innerHTML;
                svg2.selectAll(".node2")
                    .attr("fill", function(d){
                        if(d.name == text)
                            return "#FF8000";
                        else
                            return "white";
                });
                for(var cyI = 0; cyI < cylinders.length; cyI++)
                {
                    if(playerCurrent[cylinders[cyI].index].name == text)
                    {
                        cylinderSelected = cylinders[cyI];
                        var prevIdx = cylinderSelected.index;
                        triggerDisplay(prevIdx, true);
                    }
                }  
            });

            // Reset event trigger of dragging list items.
            $(document).ready(function(){
                var c = {};
                $(".cols").draggable({
                    helper: "clone",
                    appendTo: "body",
                    start: function(event, ui) {
                        c.tr = this;
                        c.helper = ui.helper;
                    }
                });
                $("#container").droppable({
                    drop: function(event, ui) {
                        refreshAll();	
                        $(c.tr).addClass('current');
                        isChosen = true;
                        var text = c.tr.firstChild.innerHTML;
                        svg2.selectAll(".node2")
                            .attr("fill", function(d){
                                if(d.name == text)
                                    return "#FF8000";
                                else
                                    return "white";
                        });
                        
                        for(var cyI = 0; cyI < cylinders.length; cyI++)
                        {
                            if(playerCurrent[cylinders[cyI].index].name == text)
                            {
                                cylinderSelected = cylinders[cyI];
                                var prevIdx = cylinderSelected.index;
                                triggerDisplay(prevIdx, true);
                            }
                        }   
                        $(c.helper).remove();
                    }
                });
            });
        }
        
        // Refresh the data panel, the list status, and the cylinders.
        function refreshAll()
        {
            // Remove all the displayed data.
            $("#playerImg").css("background-image", "none");
            $("#teamLogo").css("background-image", "none");
            $("#playerName").html("");
            $("#compPCT").html("");
            $("#passYDS").html("");
            $("#TDInt").html("");
            $("#passerRTG").html("");
            isShow = false;
            isChosen = false;
            $("#chart-zone").css("background", "rgba(255,255,255,0.8)");
            $("#data-zone").css("background", "-webkit-radial-gradient(center, circle farthest-corner, rgba(255,255,255,0) 50%, rgba(200,200,200,0.5)), -webkit-radial-gradient(center, circle, rgba(255,255,255,.35), rgba(255,255,255,0) 20%, rgba(255,255,255,0) 21%), -webkit-radial-gradient(center, circle, rgba(0,0,0,.2), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 21%), -webkit-radial-gradient(center, circle farthest-corner, rgba(240,240,240,0.5), rgba(192,192,192,0.5))");
            
            // Make all items draggable in the playerlist.
            $('.cols').removeClass('current');
            
            // Change the color of the selected circle back to the original one.
            svg2.selectAll(".node2")
                .attr('fill', "white");
            
            // Change the style of the selected historical circle back to the original one.
            if(cylinderSelected != null && typeof cylinderSelected.index != "undefined")
            {
                var cirRad = 5,
                cirMat = new THREE.LineBasicMaterial({color: 0xFFFF00, linewidth: 1}),
                cirGeo = new THREE.CircleGeometry(cirRad, 64);
                cirGeo.vertices.shift();
                for(var cyI = 0; cyI < cylinders.length; cyI++)
                {
                    if(cylinderSelected.index == cylinders[cyI].index)
                    {
                        scene.remove(circles[cyI]);
                        var cir = new THREE.Line(cirGeo, cirMat);
                        cir.position.set((playerCurrent[cylinderSelected.index].risk[0]-10)*150/10, level+1, (80-playerCurrent[cylinderSelected.index].score[0])*200/20);
                        //cir.position.set((playerCurrent[cylinderSelected.index].risk[0]-10)*150/10, level+1, (50-playerCurrent[cylinderSelected.index].rank[0])*200/50);
                        cir.rotation.x = Math.PI / 2;
                        circles[cyI] = cir;
                        scene.add(circles[cyI]);
                    }
                }
                
                // Change the color of the selected cylinder back to the original one.
                var colorIdx = 3;
                switch(playerCurrent[cylinderSelected.index].sentiment)
                {
                    case "pos":
                        colorIdx = 2;
                        break;
                    case "mid":
                        colorIdx = 1;
                        break;
                    case "neg":
                        colorIdx = 0;
                        break;
                }
                var material = cylinderSelected.material;
                material.color.setHex(sentColor[colorIdx]);
                cylinderSelected = null;
            }
        }
        
        // Display the data panel.
        function triggerDisplay(prevIdx, isClicked)
        {
            $("#playerImg").css("background", "url('"+playerCurrent[prevIdx].image+"') no-repeat");
            $("#playerImg").css("background-size","contain");
            $("#teamLogo").css("background", "url('"+playerCurrent[prevIdx].teamlogo+"') no-repeat");
            $("#teamLogo").css("background-size","contain");
            $("#playerName").html(playerCurrent[prevIdx].name);
            $("#compPCT").html(playerCurrent[prevIdx].pct);
            $("#passYDS").html(playerCurrent[prevIdx].yds);
            $("#TDInt").html(playerCurrent[prevIdx].tdint);
            $("#passerRTG").html(playerCurrent[prevIdx].rtg);
            isShow = true;
            
            // If a player is selected, the data panel should be presented in full opacity.
            if(isClicked)
            {
                $("#chart-zone").css("background", "white");
                $("#data-zone").css("background", "-webkit-radial-gradient(center, circle farthest-corner, rgba(255,255,255,0) 50%, rgba(200,200,200,0.5)), -webkit-radial-gradient(center, circle, rgba(255,255,255,.35), rgba(255,255,255,0) 20%, rgba(255,255,255,0) 21%), -webkit-radial-gradient(center, circle, rgba(0,0,0,.2), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 21%), -webkit-radial-gradient(center, circle farthest-corner, rgba(240,240,240,1), rgba(192,192,192,1))");
            }

            // If a player is selected, the corresponding cylinder should change its color.
            var colorIdx = 3;
            switch(playerCurrent[prevIdx].sentiment)
            {
                case "pos":
                    colorIdx = 2;
                    break;
                case "mid":
                    colorIdx = 1;
                    break;
                case "neg":
                    colorIdx = 0;
                    break;
            }

            var material = cylinderSelected.material;
            material.color.setHex(lightColor[colorIdx]);
            
            // If a player is selected, the corresponding historical circle should change its style.
            var cirRad = 8;
            var cirMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, side: THREE.DoubleSide});
            var cirGeo = new THREE.CircleGeometry(cirRad, 64);
            for(var cyI = 0; cyI < cylinders.length; cyI++)
            {
                if(prevIdx == cylinders[cyI].index)
                {
                    scene.remove(circles[cyI]);
                    var cir = new THREE.Mesh(cirGeo, cirMat);
                    cir.position.set((playerCurrent[prevIdx].risk[0]-10)*150/10, level+1, (80-playerCurrent[prevIdx].score[0])*200/20);
                    //cir.position.set((playerCurrent[prevIdx].risk[0]-10)*150/10, level+1, (50-playerCurrent[prevIdx].rank[0])*200/50);
                    cir.rotation.x = Math.PI / 2;
                    circles[cyI] = cir;
                    scene.add(circles[cyI]);
                }
            }
        }

        // If the window is resized, the view of camera should change as well.
        function onWindowResize() 
        {
            width = container.offsetWidth;
            height = container.offsetHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        }
        
        // Detect the mouse down event within the hawk-eye panel.
        function onPanelMouseDown(event)
        {
            event.preventDefault();
            refreshAll();
        }
        
        // Detect the mouse move event within the 3D scene container.
        function onContainerMouseMove(event) 
        {
            event.preventDefault();
            mouseVec.x = ((event.pageX - container.offsetLeft) / width) * 2 - 1;
            mouseVec.y = -((event.pageY - container.offsetTop) / height) * 2 + 1;
        }

        // Detect the mouse down event within the 3D scene container.
        function onContainerMouseDown(event) 
        {
            event.preventDefault();
            mouseVec.x = ((event.pageX - container.offsetLeft) / width) * 2 - 1;
            mouseVec.y = -((event.pageY - container.offsetTop) / height) * 2 + 1;
            
            // Get the ray casting point on the screen.
            raycaster.setFromCamera(mouseVec, camera);
  
            // If the mouse is in the container, update the data selected.
            if(Math.abs(mouseVec.x) <= 1 && Math.abs(mouseVec.y) <= 1)
            {
                var intersects = raycaster.intersectObjects(cylinders);
                var material;
                refreshAll();
                svg2.selectAll(".node2")
                    .attr("fill", "white");
                
                // If a cylinder is clicked
                if(intersects[0])
                {
                    cylinderSelected = intersects[0].object;
                    var prevIdx = cylinderSelected.index;
                    triggerDisplay(prevIdx, true);
                    isChosen = true;
 
                    // Change the color of the corresponding circle.
                    svg2.selectAll(".node2")
                        .attr("fill", function(d){
                            if(d.name == playerCurrent[prevIdx].name)
                                return "#FF8000";
                            else
                                return "white";
                    });

                    // Scroll down the player list to the position of selected item.
                    d3.selectAll(".cols").each(
                        function(e, i){
                            if(this.firstChild.innerHTML == playerCurrent[prevIdx].name)
                            {
                                $(this).addClass('current');
                                var w = $(".rankTable tbody");
                                var motion = (i-5)*$(this).height();
                                if(motion < 0)
                                    motion = 0;
                                else if(i > $('.cols').length-6)
                                    motion = ($('.cols').length-1)*$(this).height();
                                w.animate({scrollTop: motion}, 500);
                            }
                        }
                    );
                }
            }
        }

        // Animation of 3D scene by frames.
        function animate() 
        {
            var e = document.getElementById("group");
            var selected = e.options[e.selectedIndex].value;
            container.style.cursor="default";
            var selRange = document.getElementById("range").selectedIndex;
            
            // The data panel shows only when window is large enough.
            if(window.innerWidth >= 650 && window.innerHeight >= 400 && isShow)
            {
                $(".basicTopic").css("visibility", "visible");
                $("#chart-zone").css("visibility", "visible");
                $("#data-zone").css("visibility", "visible");
            }
            else
            {
                $(".basicTopic").css("visibility", "hidden");
                $("#chart-zone").css("visibility", "hidden");
                $("#data-zone").css("visibility", "hidden");
            }
            
            raycaster.setFromCamera(mouseVec, camera);
  
            // If mouse move over cylinders, the cursor will be a pointer, and the data panel will be updated.
            if(Math.abs(mouseVec.x) <= 1 && Math.abs(mouseVec.y) <= 1)
            {
                var intersects = raycaster.intersectObjects(cylinders);
                if(intersects[0])
                {
                    container.style.cursor="pointer";
                }
                if(!isChosen)
                    update(intersects);
            }
                
            // Make the stars shining all the time.
            var time = Date.now() * 0.005;
            var size = geometry.attributes.size.array;
			for(var i = 0; i < particles; i++) 
            {
				size[i] = 10 * (1 + Math.sin(0.1 * i + time));
			}
			geometry.attributes.size.needsUpdate = true;

            // If the selection bar does not change
            if(selected == optionSelected && optionSelected != null)
            {
                // If the range bar does not change
                if(selRange == rangeSelected)
                {
                    // If all old cylinders are removed
                    if(isOver)
                    {
                        // Not all new cylinders complete increasing of heights. 
                        if(cylinderCompleted != cylinders.length)
                        {
                            cylinderCompleted = 0;
                            for(var cyI = 0; cyI < cylinders.length; cyI++)
                            {
                                // Start growing the lines according to historical data and present data.
                                var playerIdx = cylinders[cyI].index;
                                scene.remove(lines[cyI]);
                                var lineMat = new THREE.LineBasicMaterial({color: 0xFFFF00, linewidth: 1});
                                var lineGeo = new THREE.Geometry();
                                lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[0]-10)*150/10, level+1, (80-playerCurrent[playerIdx].score[0])*200/20));
                                //lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[0]-10)*150/10, level+1, (50-playerCurrent[playerIdx].rank[0])*200/50));

                                // If a line does not reach the turning point
                                if(!lineChanged[cyI])
                                {
                                    //Continue growing horizontally.
                                    lineCurrent[cyI].x += interval*(((playerCurrent[playerIdx].risk[1] - lineCurrent[cyI].x) > 0)?1:-1);
                                    lineGeo.vertices.push(new THREE.Vector3((lineCurrent[cyI].x-10)*150/10, level+1, (80-playerCurrent[playerIdx].score[0])*200/20));
                                    //lineGeo.vertices.push(new THREE.Vector3((lineCurrent[cyI].x-10)*150/10, level+1, (50-playerCurrent[playerIdx].rank[0])*200/50));
                                    if(Math.abs(playerCurrent[playerIdx].risk[1] - lineCurrent[cyI].x) < interval)
                                    {
                                        lineChanged[cyI] = true;
                                    }
                                }
                                // If a line reaches the turning point
                                else
                                {
                                    lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[1]-10)*150/10, level+1, (80-playerCurrent[playerIdx].score[0])*200/20));
                                    //lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[1]-10)*150/10, level+1, (50-playerCurrent[playerIdx].rank[0])*200/50));

                                    // If a line does not reach the ending point
                                    if(!lineReached[cyI])
                                    {
                                        //Continue growing vertically.
                                        lineCurrent[cyI].z += interval*(((playerCurrent[playerIdx].score[1] - lineCurrent[cyI].z) > 0)?1:-1);
                                        lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[1]-10)*150/10, level+1, (80-lineCurrent[cyI].z)*200/20));
                                        //lineCurrent[cyI].z += interval*(((playerCurrent[playerIdx].rank[1] - lineCurrent[cyI].z) > 0)?1:-1);
                                        //lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[1]-10)*150/10, level+1, (50-lineCurrent[cyI].z)*200/50));
                                        if(Math.abs(playerCurrent[playerIdx].score[1] - lineCurrent[cyI].z) < interval)
                                        //if(Math.abs(playerCurrent[playerIdx].rank[1] - lineCurrent[cyI].z) < interval)
                                        {
                                            lineReached[cyI] = true;
                                            scene.add(mesh[cyI]); 
                                        }
                                    }
                                    // If a line reaches the ending point, the growth of this line is completed.
                                    else
                                    {
                                        lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[1]-10)*150/10, level+1, (80-playerCurrent[playerIdx].score[1])*200/20));
                                        //lineGeo.vertices.push(new THREE.Vector3((playerCurrent[playerIdx].risk[1]-10)*150/10, level+1, (50-playerCurrent[playerIdx].rank[1])*200/50));
                                        lineCompleted[cyI] = true;
                                    }
                                }

                                lines[cyI] = new THREE.Line(lineGeo, lineMat);
                                scene.add(lines[cyI]);
                                
                                // If a line completes growing, the cylinder starts to grow.
                                if(lineCompleted[cyI])
                                {
                                    var rank = playerCurrent[playerIdx].score[1] - 50;
                                    //var rank = 50-playerCurrent[playerIdx].rank[1];
                                    if(cylinders[cyI].scale.y < rank - veloH[cyI])
                                    {
                                        cylinders[cyI].scale.y += veloH[cyI];
                                        cylinders[cyI].position.y += veloH[cyI]/2;
                                    }
                                    else
                                    {
                                        cylinderCompleted++;
                                    }
                                    
                                    //console.log(cylinderCompleted);
                                }
                            }
                        }
                    }
                    // If old cylinders are not all removed
                    else
                    {
                        // Remove the existing old cylinders.
                        for(var cyI = 0; cyI < cylindersOld.length; cyI++)
                        {
                            if(cylindersOld[cyI].scale.y > 1)
                            {
                                cylindersOld[cyI].scale.y -= veloHOld[cyI];
                                cylindersOld[cyI].position.y -= veloHOld[cyI]/2;
                            }
                            else if(cylindersOld[cyI].scale.y > -1.5)
                            {
                                //console.log(scene);
                                scene.remove(cylindersOld[cyI]);
                                //console.log(veloHOld[cyI]);
                                cylindersOld[cyI].scale.y = -2;
                                isRemoved++;
                            }
                        }
                        
                        // If all the old cylinders are removed
                        if(isRemoved == cylindersOld.length || isRemoved == -1)
                        {
                            // Reset some of the growth parameters.
                            isOver = true;
                            for(var cyI = 0; cyI < cylinders.length; cyI++)
                            {
                                var playerIdx = cylinders[cyI].index;
                                scene.add(cylinders[cyI]);
                                scene.add(circles[cyI]); 
                                lineChanged[cyI] = false;
                                lineReached[cyI] = false;
                                lineCompleted[cyI] = false;
                                lineCurrent[cyI] = {x:playerCurrent[playerIdx].risk[0], z:playerCurrent[playerIdx].score[0]};
                                //lineCurrent[cyI] = {x:playerCurrent[playerIdx].risk[0], z:playerCurrent[playerIdx].rank[0]};
                            }
                            isRemoved = 0;
                        }
                    }
                }
                // If the range bar changes, reset some of the growth parameters.
                else
                {
                    rangeSelected = selRange;
                    cylinderCompleted = 0;
                    var initial = selRange*vizSize;
                    if(playerCurrent.length <= 0)
                    {
                        initial = 0;
                    }
                    
                    cylinderGenerator(initial);
                }
            }
            // If the selection bar changes
            else
            {
                // Change the player list to the selected position.
                optionSelected = selected;
                rangeSelected = -2;
                refreshAll();
                switch(selected)
                {
                    case "All":
                        playerCurrent = players;
                        break;
                    case "RB":
                        playerCurrent = playerRB;
                        break;
                    case "WR":
                        playerCurrent = playerWR;
                        break;
                    case "RB/WR":
                        playerCurrent = playerRW;
                        break;
                    case "QB":
                        playerCurrent = playerQB;
                        break;
                    case "TE":
                        playerCurrent = playerTE;
                        break;
                    case "K":
                        playerCurrent = playerK;
                        break;
                }
                
                // Display only a few players in the player list within the interval.
                var range = "";
                var counter = 0;
                for(var cyI = 0; cyI < playerCurrent.length; cyI++)
                {                    
                    counter++;
                    if(counter % vizSize == 0)
                    {
                        var first = (Math.floor(counter/vizSize)-1)*vizSize+1;
                        var last = counter;
                        range += "<option value="+first+"-"+last+">"+first+"-"+last+"</option>";
                    }
                }
                if(counter % vizSize != 0)
                {
                    var first = Math.floor(counter/vizSize)*vizSize+1;
                    var last = counter;
                    range += "<option value="+first+"-"+last+">"+first+"-"+last+"</option>";
                }
                $("#range").html(range);
            }
            
            // Render each frame.
            requestAnimationFrame(animate, renderer.domElement);
            renderer.render(scene, camera);
        }
        
        // If mouse is over a cylinder
        function update(intersects)
        {
            var material;
            refreshAll();
            svg2.selectAll(".node2")
                .attr("fill", "white");
            
            if(intersects[0])
            {
                // Change the color of the cylinder and display the data panel.
                cylinderSelected = intersects[0].object;
                var prevIdx = cylinderSelected.index;
                triggerDisplay(prevIdx, false);

                svg2.selectAll(".node2")
                    .attr("fill", function(d){
                        if(d.name == playerCurrent[prevIdx].name)
                            return "#FF8000";
                        else
                            return "white";
                });
            }
        }
        
        // Set the color bar.
        function colorScale() 
        {
            var scale = d3.scale.linear()
                .domain([0, 0.5, 1])
                .range(["#0080FF", "#298A08", "#DF7401"]);
            return scale;
        };
        
        function infoPresenter()
        {
            // Display the axes of the hawk-eye panel.
            svg2.append("g")
                .attr("class", "axis2")
                .attr("id", "axisX2")
                .attr("fill", "white")
                .attr("transform", "translate(0," + 285 + ")")
                .call(xAxis2);
            svg2.append("g")
                .attr("class", "axis2")
                .attr("id", "axisY2")
                .attr("fill", "white")
                .attr("transform", "translate(" + 25 + ",0)")
                .call(yAxis2);

            svg2.append("text")
                .attr("x", 8)
                .attr("y", 30)
                .style("font-size","8px")
                .attr("fill","white")
                .text("Rank");
            svg2.append("text")
                .attr("x", 10)
                .attr("y", 290)
                .style("font-size","8px")
                .attr("fill","white")
                .text("Risk");

            var cv  = document.getElementById('cv'),
                ctx = cv.getContext('2d');

            // Display the color bar.
            for(var i = 0; i <= 255; i++) {
                ctx.beginPath();
                var color = colorScale()(i/255);
                ctx.fillStyle = color;

                ctx.fillRect(i, 0, 200, 50);
            }

            // Display text information.
            svg3.append("text")
                .attr("x", 30)
                .attr("y", 20)
                .style("font-size","10px")
                .attr("fill","yellow")
                .text("Color of the Cylinders:");
            svg3.append("text")
                .attr("x", 15)
                .attr("y", 55)
                .style("font-size","10px")
                .attr("fill","white")
                .text("neg");
            svg3.append("text")
                .attr("x", 72.5)
                .attr("y", 55)
                .style("font-size","10px")
                .attr("fill","white")
                .text("neu");
            svg3.append("text")
                .attr("x", 135)
                .attr("y", 55)
                .style("font-size","10px")
                .attr("fill","white")
                .text("pos");
            svg3.append("text")
                .attr("x", 30)
                .attr("y", 90)
                .style("font-size","10px")
                .attr("fill","yellow")
                .text("Height of Cylinders:");

            svg3.append("text")
                .attr("x", 30)
                .attr("y", 110)
                .style("font-size","10px")
                .attr("fill","white")
                .text("Value of the Player");
        }
    }
})
// If no data is obtained, display error message.
.fail(function() {
    playerCurrent = [];
    $(".rankTable tbody").html("Connection Failed!");
});

// If the window is resized, the view of camera should change as well. This runs asynchronously with the ajax.
function onWindowResize() 
{
    width = container.offsetWidth;
    height = container.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}
