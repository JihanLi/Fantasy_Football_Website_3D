/*************************************************************************
 * 
 * team.js
 * 
 * This JavaScript file enables the interactivity of 3D interface for team.html. 
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
var svg3 = d3.select("#infoPanel").append("svg")
            .attr("width",document.getElementById('infoPanel').clientWidth)
            .attr("height",document.getElementById('infoPanel').clientHeight)
            .append("g");

// Define 3d models including cylinders, texts, stars, field and obj loader.
var cylinders = [];
var mesh = [], mesh2 = [];
var stars, geometry, particles = 45000, shaders;
var trapezoid;
var rect, espnPlane, ffaPlane;
var loader;

// Define the basic properties of cylinders.
var sentColor = [0x0080FF, 0x298A08, 0xDF7401, 0xBDBDBD];
var lightColor = [0x00BFFF, 0x01DF3A, 0xFE9A2E, 0xF2F2F2];
var pos = [{x: -70, z: -120, name: "WR"},{x: -40, z: -60, name: "RB"},{x: -10, z: -90, name: "QB"},
          {x: -10, z: -20, name: "K"},{x: 20, z: -60, name: "RB"},{x: 50, z: -120, name: "TE"},
          {x: 90, z: -120, name: "RB/WR"},{x: 110, z: -60, name: "WR"}];
var level = -30;
var veloMax = 1, veloMin = 0.5, veloH = [];

// Define the camera.
var aspect = width / height;
var camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
camera.position.set(1.47, 147.87, 268.17);

// Define controls.
var controls;
var mouseVec = new THREE.Vector2();

// Define a variable to store the data.
var players = [];

// Define a number of indicators.
var found; // if a player is found or not during a search
var isShow = false; // if the window size allows the presentation of the data panel or not
var isChosen = false; // if a cylinder or a player is selected or not
var cylinderSelected = null; // the cylinder selected previously
var optionSelected = null; // the option selected previously in the selection bar 
var positionSelected = -1; // the position selected previously


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
        for(var cyI = 0; cyI < players.length; cyI++)
        {
            players[cyI].isActive = true;
        }
        
        init();
        animate();
        infoPresenter();
        eventTrigger();
        
        
        
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
            
            // Initialize cylinders.
            cylinderGenerator();
            
            // Initialize the football field.
            fieldGenerator();
            
            // Add event listeners to the container.
            window.addEventListener('resize', onWindowResize, false);
            container.addEventListener( 'mousedown', onContainerMouseDown, false );
            container.addEventListener( 'mousemove', onContainerMouseMove, false );
        }
        
        // Generate stars.
        function starGenerator()
        {
            // Define external parameters for shaders.
            var attributes = {
				size:        {type: 'f', value: null},
				customColor: {type: 'c', value: null}

			};
			var uniforms = {
				color:     {type: "c", value: new THREE.Color( 0xffffff )},
				texture:   {type: "t", value: THREE.ImageUtils.loadTexture( "source/star.jpg" )}
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
            
			for( var v = 0; v < particles; v++ ) 
            {
				values_size[v] = 10*Math.random()+10;
                
                radius = (Math.random() * 0.2 + 0.8) * 1500;
                phi = 2 * Math.random() * Math.PI;
                theta = Math.acos(2 * Math.random() - 1.0);
				positions[v * 3 + 0] = radius*Math.sin(theta)*Math.cos(phi);
				positions[v * 3 + 1] = radius*Math.sin(theta)*Math.sin(phi);
				positions[v * 3 + 2] = radius*Math.cos(theta);

				values_color[v * 3 + 0] = 1;
				values_color[v * 3 + 1] = 1;
				values_color[v * 3 + 2] = 1;
			}
            
            // Initialize the external parameters.
			geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.addAttribute('customColor', new THREE.BufferAttribute(values_color, 3));
            geometry.addAttribute('size', new THREE.BufferAttribute(values_size, 1));

            // Add stars to the scene.
            stars = new THREE.PointCloud(geometry, shaders);
            scene.add(stars);
        }
        
        // Generate cylinders for each position.
        function cylinderGenerator()
        {
            for(var cyI = 0; cyI < pos.length; cyI++)
            {
                // Set parameters for each cylinder.
                cylinders.push(new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1, 50, 50, false), new THREE.MeshLambertMaterial({ color: sentColor[3]})));
                cylinders[cyI].index = -1;
                cylinders[cyI].pos = cyI;
                cylinders[cyI].position.x += pos[cyI].x;
                cylinders[cyI].position.z += pos[cyI].z;
                cylinders[cyI].position.y = level;
                cylinders[cyI].overdraw = true;
                cylinders[cyI].castShadow = true;
                
                // Define a random speed of increasing the height of a cylinder.
                veloH.push((Math.random()* (veloMax - veloMin)) + veloMin);

                // Generate texts under the cylinders. The canvas should be transparent.
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                context.font = "Bold 50px Arial";
                context.fillStyle = "#B40404";
                context.fillText(pos[cyI].name, 110, 70,100);
                var texture = new THREE.Texture(canvas) 
                texture.needsUpdate = true;
                var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
                material.transparent = true;
                mesh[cyI] = new THREE.Mesh(new THREE.PlaneBufferGeometry(canvas.width/5, canvas.height/5), material);
                mesh[cyI].position.set(cylinders[cyI].position.x,cylinders[cyI].position.y,cylinders[cyI].position.z+15);   
            }
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
            loader.load('source/field/nfl_football_field.obj', 'source/field/nfl_football_field.mtl', function(object) 
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
                for(var cyI = 0; cyI < pos.length; cyI++)
                {
                    scene.add(cylinders[cyI]);
                    scene.add(mesh[cyI]);
                }
            }, onProgress, onError);
        }
        
        // Refresh the data panel, the list status, and the cylinders.
        function refreshAll(isUpdate)
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
            
            // Change the color of the selected cylinder back to the original one.
            if(isUpdate)
            {
                if(cylinderSelected != null && typeof cylinderSelected.index != "undefined")
                {
                    var colorIdx = 3;
                    if(cylinderSelected.index != -1)
                    {
                        switch(players[cylinderSelected.index].sentiment)
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
                    }
                    var material = cylinderSelected.material;
                    material.color.setHex(sentColor[colorIdx]);
                    cylinderSelected = null;
                }
            }
        }
        
        // Display the data panel.
        function triggerDisplay(prevIdx, isClicked)
        {
            $("#playerImg").css("background", "url('"+players[prevIdx].image+"') no-repeat");
            $("#playerImg").css("background-size","contain");
            $("#teamLogo").css("background", "url('"+players[prevIdx].teamlogo+"') no-repeat");
            $("#teamLogo").css("background-size","contain");
            $("#playerName").html(players[prevIdx].name);
            $("#compPCT").html(players[prevIdx].pct);
            $("#passYDS").html(players[prevIdx].yds);
            $("#TDInt").html(players[prevIdx].tdint);
            $("#passerRTG").html(players[prevIdx].rtg);
            isShow = true;
            
            // If a player is selected, the data panel should be presented in full opacity.
            if(isClicked)
            {
                $("#chart-zone").css("background", "white");
                $("#data-zone").css("background", "-webkit-radial-gradient(center, circle farthest-corner, rgba(255,255,255,0) 50%, rgba(200,200,200,0.5)), -webkit-radial-gradient(center, circle, rgba(255,255,255,.35), rgba(255,255,255,0) 20%, rgba(255,255,255,0) 21%), -webkit-radial-gradient(center, circle, rgba(0,0,0,.2), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 21%), -webkit-radial-gradient(center, circle farthest-corner, rgba(240,240,240,1), rgba(192,192,192,1))");
            }
        }
        
        // Reset all triggers when player list is changed.
        function tableChange(selectValue)
        {
            var element = document.getElementById('group');
            element.value = selectValue;
            optionSelected = selectValue;
            
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
                refreshAll(false);	
                $(this).addClass('current');
                isChosen = true;
                var text = this.firstChild.innerHTML;
                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    if(players[cyI].name == text)
                    {
                        triggerDisplay(cyI, true);
                    }
                }  
            });

            // Reset event trigger of dragging list items.
            $(document).ready(function(){
                var c = {};
                $(".cols").not(document.getElementsByClassName("cols disabled")).draggable({
                    helper: "clone",
                    appendTo: "body",
                    cursor: 'pointer',
                    start: function(event, ui) {
                        c.tr = this;
                        c.helper = ui.helper;
                    }
                });
                $("#container").droppable({
                    drop: function(event, ui) {
                        refreshAll(false);
                        
                        // Make the current item selected.
                        $(c.tr).addClass('current');
                        isChosen = true;
                        
                        // Replace the selected cylinder with a new one.
                        if(positionSelected != -1 && cylinders[positionSelected].index != -1)
                        {
                            d3.selectAll(".cols").each(function(e, i){
                                if(this.firstChild.innerHTML == players[cylinders[positionSelected].index].name)
                                {
                                    $(this).removeClass('disabled');
                                    players[cylinders[positionSelected].index].isActive = true;
                                }
                            });
                        }
                        
                        // If a position is selected
                        var text = c.tr.firstChild.innerHTML;
                        for(var cyI = 0; cyI < players.length; cyI++)
                        {
                            if(players[cyI].name == text)
                            {
                                triggerDisplay(cyI, true);
                                
                                if(positionSelected != -1)
                                {
                                    // Disable the draggability of the current item.
                                    $(c.tr).addClass('disabled');
                                    players[cyI].isActive = false;
                                    
                                    // Update the cylinder for this position.
                                    cylinderSelected = cylinders[positionSelected];
                                    cylinderSelected.index = cyI;
                                    var colorIdx = 3;
                                    switch(players[cylinderSelected.index].sentiment)
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

                                    // Replace the new texts for the cylinder.
                                    scene.remove(mesh2[positionSelected]);
                                    var canvas = document.createElement('canvas');
                                    var context = canvas.getContext('2d');
                                    context.font = "Bold 30px Arial";
                                    context.fillStyle = "rgba(255,255,0,1)";
                                    context.fillText(players[cyI].name, 50, 70, 200);
                                    var texture = new THREE.Texture(canvas) 
                                    texture.needsUpdate = true;

                                    var material = new THREE.MeshBasicMaterial({map: texture, side:THREE.DoubleSide});
                                    material.transparent = true;

                                    mesh2[positionSelected] = new THREE.Mesh(new THREE.PlaneBufferGeometry(canvas.width/5, canvas.height/5), material);
                                    mesh2[positionSelected].position.set(cylinders[positionSelected].position.x,50-players[cyI].rank[1] + level,cylinders[positionSelected].position.z+25);
                                    scene.add(mesh2[positionSelected]);   
                                    positionSelected = -1;
                                }
                            }
                        }  
                        $(c.helper).remove();
                    }
                });
            });
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
                refreshAll(true);
                positionSelected = -1;
                
                // If a cylinder is clicked
                if(intersects[0])
                {
                    cylinderSelected = intersects[0].object;
                    var prevIdx = cylinderSelected.index;
                    positionSelected = cylinderSelected.pos;
                    
                    // Change the player list to corresponding position.
                    var disp = "";
                    for(var cyI = 0; cyI < players.length; cyI++)
                    {
                        if(pos[positionSelected].name == players[cyI].group)
                        {    
                            if(players[cyI].isActive == true)
                                disp += "<tr class='cols'>";
                            else
                                disp += "<tr class='cols disabled'>";
                            disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                            disp += "</tr>";
                        }
                        else if(pos[positionSelected].name == "RB/WR")
                        {
                            if(players[cyI].group == "RB" || players[cyI].group == "WR")
                            {    
                                if(players[cyI].isActive == true)
                                    disp += "<tr class='cols'>";
                                else
                                    disp += "<tr class='cols disabled'>";
                                disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                                disp += "</tr>";
                            }
                        }
                    }
                    $(".rankTable tbody").html(disp);
                    tableChange(pos[positionSelected].name);
                    isChosen = true;
                    
                    // Change the color of selected cylinder.
                    var colorIdx = 3;
                    if(prevIdx != -1)
                    {
                        switch(players[prevIdx].sentiment)
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
                        
                        triggerDisplay(prevIdx, true);
                        
                        // Scroll down the player list to the position of selected item.
                        d3.selectAll(".cols").each(
                            function(e, i){
                                if(this.firstChild.innerHTML == players[prevIdx].name)
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
                    material = intersects[0].object.material;
                    material.color.setHex(lightColor[colorIdx]);
                }
                // If elsewhere is clicked
                else
                {
                    // Change the player list to All.
                    var disp = "";
                    for(var cyI = 0; cyI < players.length; cyI++)
                    { 
                        if(players[cyI].isActive == true)
                            disp += "<tr class='cols'>";
                        else
                            disp += "<tr class='cols disabled'>";
                        disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                        disp += "</tr>";
                    }
                    $(".rankTable tbody").html(disp);
                    tableChange("All");
                }
            }
        }

        // Animation of 3D scene by frames.
        function animate() 
        {
            var e = document.getElementById("group");
            var selected = e.options[e.selectedIndex].value;
            container.style.cursor="default";
            
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
                // Increase or decrease the height of each cylinder according to which player it represents.
                for(var cyI = 0; cyI < cylinders.length; cyI++)
                {
                    var playerIdx = cylinders[cyI].index;
                    if(playerIdx != -1)
                    {
                        var rank = 50-players[playerIdx].rank[1];
                        if(cylinders[cyI].scale.y < rank - veloH[cyI])
                        {
                            cylinders[cyI].scale.y += veloH[cyI];
                            cylinders[cyI].position.y += veloH[cyI]/2;
                        }
                        if(cylinders[cyI].scale.y > rank + veloH[cyI])
                        {
                            cylinders[cyI].scale.y -= veloH[cyI];
                            cylinders[cyI].position.y -= veloH[cyI]/2;
                        }
                    }
                    else
                    {
                        if(cylinders[cyI].scale.y > 1)
                        {
                            cylinders[cyI].scale.y -= veloH[cyI];
                            cylinders[cyI].position.y -= veloH[cyI]/2;
                        }
                    }
                }
            }
            // If the selection bar changes
            else
            {
                // Change the player list as well and reset all table triggers.
                var disp = "";
                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    if(selected == players[cyI].group || selected == "All")
                    {    
                        if(players[cyI].isActive == true)
                            disp += "<tr class='cols'>";
                        else
                            disp += "<tr class='cols disabled'>";
                        disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                        disp += "</tr>";
                    }
                    else if(selected == "RB/WR")
                    {
                        if(players[cyI].group == "RB" || players[cyI].group == "WR")
                        {    
                            if(players[cyI].isActive == true)
                                disp += "<tr class='cols'>";
                            else
                                disp += "<tr class='cols disabled'>";
                            disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                            disp += "</tr>";
                        }
                    }
                }
                $(".rankTable tbody").html(disp);
                refreshAll(true);
                positionSelected = -1;
                tableChange(selected);
            }
            
            // Render each frame.
            requestAnimationFrame(animate, renderer.domElement);
            renderer.render(scene, camera);
        }
        
        // If mouse is over a cylinder
        function update(intersects)
        {
            var material;
            refreshAll(true);
            
            if(intersects[0])
            {
                // Change the color of the cylinder and display the data panel.
                cylinderSelected = intersects[0].object;
                var prevIdx = cylinderSelected.index;

                var colorIdx = 3;
                
                if(prevIdx != -1)
                {
                    switch(players[prevIdx].sentiment)
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
                    triggerDisplay(prevIdx, false);
                }
                material = intersects[0].object.material;
                material.color.setHex(lightColor[colorIdx]);
            }
        }
        
        // If find a player when searching
        function updateTable(selectValue, playerName)
        {
            // Change the player list to that player.
            var disp = "";
            for(var cyI = 0; cyI < players.length; cyI++)
            {
                if(selectValue == players[cyI].group || selectValue == "All")
                {    
                    if(players[cyI].name == playerName)
                    {
                        if(players[cyI].isActive == true)
                            disp += "<tr class='cols current'>";
                        else
                            disp += "<tr class='cols current disabled'>";
                    }
                    else
                    {
                        if(players[cyI].isActive == true)
                            disp += "<tr class='cols'>";
                        else
                            disp += "<tr class='cols disabled'>";
                    }
                    
                    disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                    disp += "</tr>";
                }
                else if(selectValue == "RB/WR")
                {
                    if(players[cyI].group == "RB" || players[cyI].group == "WR")
                    {    
                        if(players[cyI].name == playerName)
                        {
                            if(players[cyI].isActive == true)
                                disp += "<tr class='cols current'>";
                            else
                                disp += "<tr class='cols current disabled'>";
                        }
                        else
                        {
                            if(players[cyI].isActive == true)
                                disp += "<tr class='cols'>";
                            else
                                disp += "<tr class='cols disabled'>";
                        }
                        disp += "<td>"+players[cyI].name+"</td><td>"+players[cyI].group+"</td><td>"+players[cyI].rank[1]+"</td><td>"+players[cyI].score[1]+"</td><td>"+players[cyI].risk[1]+"</td><td>"+players[cyI].sentiment+"</td>";
                        disp += "</tr>";
                    }
                }
            }
            $(".rankTable tbody").html(disp);
            tableChange(selectValue);
        }
        
        // Set the color bar.
        function colorScale() 
        {
            var scale = d3.scale.linear()
                .domain([0, 0.5, 1])
                .range(["#0080FF", "#298A08", "#DF7401"]);
            return scale;
        };
        
        // Display the information panel.
        function infoPresenter()
        {
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
        
        // Some special event triggers.
        function eventTrigger()
        {
            var names = [];
            for(var cyI = 0; cyI < players.length; cyI++)
            {
                names.push(players[cyI].name);
            }

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

            // Search a player in the database.
            $('.searchButton').click(function(){
                var inputValue = document.getElementById("search").value;
                document.getElementById("search").value = "";
                isChosen = true;

                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    if(inputValue == players[cyI].name)
                    { 
                        triggerDisplay(cyI, true);

                        var element = document.getElementById('group');
                        element.value = players[cyI].group;
                        updateTable(element.value, players[cyI].name);
                        found = true;
                    }
                }

                // If the player name is not found, display error message.
                if(!found)
                {
                    $("#playerImg").css("background-image", "none");
                    $("#teamLogo").css("background-image", "none");
                    $("#playerName").html("No Record!");
                    $("#compPCT").html("No Record!");
                    $("#passYDS").html("No Record!");
                    $("#TDInt").html("No Record!");
                    $("#passerRTG").html("No Record!");
                    isShow = true;

                    var element = document.getElementById('group');
                    element.value = "All";
                    updateTable(element.value, "");
                }
                else 
                {
                    found = false;
                }
            });

            // Remove a selected cylinder.
            $("#selclr").click(function(){
                refreshAll(false);
                //console.log(positionSelected);
                if(positionSelected != -1)
                {
                    cylinderSelected = cylinders[positionSelected];

                    // Make the current item in the player list draggable.
                    if(cylinderSelected.index != -1)
                    {
                        d3.selectAll(".cols").each(function(e, i){
                            if(this.firstChild.innerHTML == players[cylinders[positionSelected].index].name)
                            {
                                $(this).removeClass('disabled');
                                players[cylinders[positionSelected].index].isActive = true;
                            }
                        });
                    }

                    cylinderSelected.index = -1;
                    var material = cylinderSelected.material;
                    material.color.setHex(sentColor[3]);
                    scene.remove(mesh2[positionSelected]); 
                    cylinderSelected = null;
                    positionSelected = -1;
                }
            });

            // Remove all cylinders in the scene.
            $("#allclr").click(function(){
                refreshAll(false);
                for(var cyI = 0; cyI < pos.length; cyI++)
                {
                    cylinderSelected = cylinders[cyI];
                    cylinderSelected.index = -1;
                    var material = cylinderSelected.material;
                    material.color.setHex(sentColor[3]);
                    scene.remove(mesh2[cyI]); 
                }

                d3.selectAll(".cols").each(function(e, i){
                    $(this).removeClass('disabled');
                });

                for(var cyI = 0; cyI < players.length; cyI++)
                {
                    players[cyI].isActive = true;
                }
                cylinderSelected = null;
                positionSelected = -1;
            });
        }
    }
})
// If no data is obtained, display error message.
.fail(function() {
    players = [];
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
