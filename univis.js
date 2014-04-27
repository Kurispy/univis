var barPad = 1;
var activeRoutes = ["A", "B", "C", "D", "E", "F", "G", "J", "K", "L", "M", 
        "O", "P", "Q", "S", "T", "V", "W"];
var activeDays = [0, 1, 2, 3, 4, 5, 6];
var activeStop = "Hutchison & California (WB)";
var dayNames = ["S", "M", "T", "W", "T", "F", "S"];
var routeColors = {A:"#F0649E", B:"#50863D", C:"#A86B79", D:"#0B7BC0",
    E:"#60BB46", F:"#825DA8", G:"#51929F", J:"#D6A477", K:"#F26524",
    L:"#F79420", M:"#C33F97", O:"#754D25", P:"#D52D27", Q:"#D52D27",
    S:"#808285", T:"#EE2E24", V:"#FFCE0D", W:"#118D9B"};
var routeDescriptions = {A:"Downtown / 5th St. / Alhambra",
    B:"Sycamore / Drake",
    C:"Sycamore / Wake Forest",
    D:"Lake / Arlington",
    E:"Downtown / F St. / J St.",
    F:"Oak / E. Alvarado / Catalina",
    G:"Anderson / Alvarado / N. Sycamore",
    J:"Anderson / Alvarado / N. Sycamore",
    K:"Lake / Arthur",
    L:"E. 8th St. / Pole Line",
    M:"Cowell / Richards",
    O:"Shopper's Shuttle / Downtown / Target",
    P:"Davis Perimeter Counter Clockwise",
    Q:"Davis Perimeter Clockwise",
    S:"Holmes / Harper",
    T:"Davis High",
    V:"West Village",
    W:"Cowell / Lillard / Drummond"};
var routeTerminals = {A:"Silo", B:"MU", C:"Silo", D:"Silo",
    E:"MU", F:"MU", G:"MU", J:"Silo", K:"MU",
    L:"Silo", M:"MU", O:"Silo", P:"MU", Q:"MU",
    S:"", T:"", V:"Silo", W:"Silo"};
var routeBusiestStopB = new Object();
var routeBusiestStopD = new Object();

// Displays a map with bus route overlays
var mapDisplay = d3.select("body").append("div")
    .attr({
        id: "map-canvas",
        class: "displayDiv"
    })
    .style({
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "73%",
        height: "67%"
    });
    
// Displays a graph of passengers vs. bus line
var passCountDisplay = d3.select("body").append("div")
    .attr("class", "displayDiv")
    .style({
        position: "absolute",
        left: "0px",
        top: "67%",
        width: "50%",
        height: "33%"
    })
    .append("svg")
    .attr({
        class: "display",
        width: "100%",
        height: "100%",
        viewBox: "0 0 480 195"
    });

// Displays a graph of how many passengers boarded/deboarded at a stop
var stopInfoDisplay = d3.select("body").append("div")
    .attr("class", "displayDiv")
    .style({
        position: "absolute",
        left: "50%",
        top: "67%",
        width: "50%",
        height: "33%"
    })
    .append("svg")
    .attr({
        class: "display",
        width: "100%",
        height: "100%",
        viewBox: "0 0 480 195"
    });

// Contains controls for manipulating what data is displayed
var controlDisplay = d3.select("body").append("div")
    .attr("class", "displayDiv")
    .style({
        position: "absolute",
        left: "73%",
        top: "0px",
        width: "27%",
        height: "48.25%"
    })
    .append("svg")
    .attr({
        class: "display",
        width: "100%",
        height: "100%",
        viewBox: "0 0 260 260"
    });

// Contains info about the currently selected route
var routeInfoDisplay = d3.select("body").append("div")
    .attr("class", "displayDiv")
    .style({
        position: "absolute",
        left: "73%",
        top: "48.25%",
        width: "27%",
        height: "18.75%"
    })
    .append("svg")
    .attr({
        class: "display",
        width: "100%",
        height: "100%",
        viewBox: "0 0 260 105"
    });

// Read in the csv file
d3.csv("unitrans-oct-2011.csv", function(d) {
    return {
        stoptitle: d.stopTitle,
        date: new Date(d.date + 'T' + d.time),
        boarding: +d.boarding,
        deboarding: +d.deboarding,
        route: d.route
    };
}, function(data) {
    initDisplays();
    
    updateDisplays();
    
    function initDisplays() {
        initControlDisplay();
        initMapDisplay();
        initStopInfoDisplay();
    }
    
    function updateDisplays() {
        // Examine current settings to see what data is active
        var activeData = data.filter(function(element) {
            return activeRoutes.indexOf(element.route) !== -1
               && activeDays.indexOf(element.date.getDay()) !== -1; 
        });
        
        // PASSENGER COUNT DISPLAY
        var byRoute = d3.nest()
            .key(function(d) { return d.route; })
            .sortKeys(d3.ascending)
            .rollup(function(d) {
                return d3.sum(d, function(b) { 
                    return b.boarding;
                });
            })
            .entries(activeData);

        byRoute.sort(function(a, b) {
            return d3.descending(a.values, b.values);
        });

        // Scales
        var sizeScale = d3.scale.linear()
            .domain([0, d3.max(byRoute, function(d) { return d.values; })])
            .range([0, 100]);

        // Bars
        // Enter
        passCountDisplay.selectAll("rect")
            .data(byRoute)
            .enter()
            .append("rect")
            .on("mouseover", function(d) {
                d3.select(this)
                    .attr("stroke", "black");

                passCountDisplay.append("text")
                    .attr("id", "passCountTT")
                    .attr("x", "50%")
                    .attr("y", "25%")
                    .text(d.key + " " + d.values);
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr("stroke", null);

                d3.selectAll("text#passCountTT")
                    .remove();
            })
            .attr("stroke-width", 2)
            .attr("x", function(d, i) {
                return i * (100 / byRoute.length) + (barPad / 2) + "%";
            })
            .attr("y", function(d) {
                return 100 - sizeScale(d.values) + "%";
            })
            .attr("width", (100 / byRoute.length - barPad) + "%")
            .attr("height", function(d) {
                return sizeScale(d.values) + "%";
            })
            .attr("fill", function(d) {
                return routeColors[d.key];
            });
        
        // Update
        passCountDisplay.selectAll("rect")
            .data(byRoute)
            .attr("stroke-width", 2)
            .attr("x", function(d, i) {
                return i * (100 / byRoute.length) + (barPad / 2) + "%";
            })
            .attr("y", function(d) {
                return 100 - sizeScale(d.values) + "%";
            })
            .attr("width", (100 / byRoute.length - barPad) + "%")
            .attr("height", function(d) {
                return sizeScale(d.values) + "%";
            })
            .attr("fill", function(d) {
                return routeColors[d.key];
            });
        
        // Exit
        passCountDisplay.selectAll("rect")
            .data(byRoute)
            .exit()
            .remove();
    }
    
    function initControlDisplay() {
        initTimescaleControl();
        initRouteButtons();
        
            
    }
    
    function initMapDisplay() {
        var byStop = d3.nest()
            .key(function(d) { return d.stoptitle; })
            .rollup(function(d) {
                return d3.sum(d, function(b) { 
                    return b.boarding;
                });
            })
            .map(data, d3.map);
        
        var mapOptions = {
          center: new google.maps.LatLng(38.553596, -121.739240),
          zoom: 14
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);

        d3.xml("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=unitrans",
            function(routeData) {
                var routes = routeData.getElementsByTagName("route");
                for(var i = 0; i < routes.length; i++) {
                    // Filter out any routes that we don't have data for
                    if(activeRoutes.indexOf(routes[i].getAttribute("title")) === -1)
                        continue;
                    
                    var paths = routes[i].getElementsByTagName("path");
                    for(var j = 0; j < paths.length; j++) {
                        var points = paths[j].getElementsByTagName("point");
                        var latlongs = new google.maps.MVCArray();
                        for(var k = 0; k < points.length; k++) {
                            latlongs.push(new google.maps.LatLng(points[k].getAttribute("lat"),
                                points[k].getAttribute("lon")));
                        }
                        var polyline = new google.maps.Polyline({
                            path: latlongs,
                            strokeColor: routes[i].getAttribute("color"),
                            strokeOpacity: 0.25,
                            strokeWeight: 4
                        });
                        polyline.setMap(map);
                    }
                    
                    var stops = routes[i].getElementsByTagName("stop");
                    for(var j = 0; j < stops.length; j++) {
                        // Filter out any stops that we don' have data for
                        if(typeof byStop.get(stops[j].getAttribute("title")) === "undefined")
                            continue;
                        
                        var circle = new google.maps.Circle({
                            center: new google.maps.LatLng(stops[j].getAttribute("lat"), stops[j].getAttribute("lon")),
                            radius: Math.max(byStop.get(stops[j].getAttribute("title")) / 100, 2),
                            zIndex: -(Math.round(byStop.get(stops[j].getAttribute("title")) / 100)),
                            map: map,
                            fillColor: routes[i].getAttribute("color")
                        });
                        setListener(circle, stops[j].getAttribute("title"));
                    }
                }
        });
        
        // Listener closure
        function setListener(circle, name) {
            google.maps.event.addListener(circle, 'click', function(event) {
                activeStop = name;
            });
        }
    }
    
    function initStopInfoDisplay() {
        if(activeStop === null) {
            stopInfoDisplay.append("text")
                .attr({
                    "text-anchor": "middle",
                    x: "50%",
                    y: "50%"
                })
                .text("Select a stop on the map to view details.");
            
            return;
        }
        
        var activeData = data.filter(function(element) {
            return activeStop === element.stoptitle; 
        });
        
        var chart = stopInfoDisplay.append("g")
            .attr("transform", "translate(50, 30)");
        
        var xScale = d3.time.scale()
            .domain([d3.min(activeData, function(d) { return d.date; }),
                d3.max(activeData, function(d) { return d.date; })])
            .range([0, 400]);
        
        var yScale = d3.scale.linear()
            .domain([-(d3.max(activeData, function(d) { return d.deboarding; })),
                d3.max(activeData, function(d) { return d.boarding; })])
            .range([120, 0]);
        
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickSize(1)
            .ticks(10);
        
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickSize(1)
            .ticks(3);
        
        chart.append("g")
            .attr({
                class: "timeAxis",
                transform: "translate(0, 67)"
            })
            .call(xAxis);
        
        chart.append("g")
            .attr("class", "axis")
            .call(yAxis);
        
        var zoom = d3.behavior.zoom()
            .x(xScale)
            .y(yScale)
            .scaleExtent([1, 100])
            .on("zoom", onZoom);
    
        chart.call(zoom);
    
        chart.append("g")
            .attr("id", "points")
            .selectAll("circle")
            .data(activeData)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", function(d) {
                return xScale(d.date);
            })
            .attr("cy", function(d, i){
                return yScale(d.boarding);
            })
            .attr("r", 1)
            .attr("fill", function(d, i) {
                return routeColors[d.route];
            });
        
        function onZoom() {
            chart.select(".timeAxis").call(xAxis);
            chart.selectAll("#points>circle")
                .attr("cx", function(d) {
                    return xScale(d.date);
                });
        }
    }
    
    function initTimescaleControl() {
        
        
        var byDate = d3.nest()
            .key(function(d) { return d.date.getDate(); })
            .sortKeys(d3.ascending)
            .rollup(function(d) {
                return d3.sum(d, function(b) { 
                    return b.boarding;
                });
            })
            .entries(data);
        
        
        var timescaleController = controlDisplay.append("g")
            .attr("transform", "translate(26, 26)");
        
        var xScale = d3.scale.linear()
            .domain([0, d3.max(byDate, function(d) { return d.values; })])
            .range([0, 130]);
        
        var yScale = d3.time.scale()
            .domain([d3.min(data, function(d) { return d.date; }),
                d3.max(data, function(d) { return d.date; })])
            .range([0, 182]);
        
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickSize(0)
            .ticks(31);
    
        var zoom = d3.behavior.zoom()
            .x(xScale)
            .y(yScale)
            .size([130, 182])
            .scaleExtent([1, 100])
            .on("zoom", onZoom);
        
        timescaleController.call(zoom);
        
        timescaleController.append("g")
            .attr("class", "timeAxis")
            .call(yAxis);
        
        timescaleController.selectAll("rect")
            .data(byDate)
            .enter()
            .append("rect")
            .attr("width", function(d) {
                return xScale(d.values);
            })
            .attr("height", 182 / byDate.length)
            .attr("y", function(d, i){
                return (182 / byDate.length) * i;
            })
            .attr("fill", function(d, i) {
                return (i % 2) ? "#888" : "#000";
            });
            
        function onZoom() {
            timescaleController.select(".timeAxis").call(yAxis);
            timescaleController.selectAll("rect")
                .attr("transform", "translate(0, " + d3.event.translate[1] + 
                    "), scale(" + d3.event.scale + ")");
        }
    }
    
    function initRouteButtons() {
        var routeButton = controlDisplay.append("g")
            .selectAll("g")
            .data(activeRoutes)
            .enter()
            .append("g");

        routeButton.append("rect")
            .attr({
                class: "dataSwitchBG",
                height: 26,
                width: 26
            })
            .attr("fill", function(d) {
                return routeColors[d];
            })
            .attr("x", function(d, i) {
                return 208 + Math.floor(i / 9) * 26;
            })
            .attr("y", function(d, i) {
                return (i % 9) * 26;
            });

        routeButton.append("text")
            .attr("class", "dataSwitchText")
            .attr("x", function(d, i) {
                return 208 + Math.floor(i / 9) * 26 + 13;
            })
            .attr("y", function(d, i) {
                return (i % 9) * 26 + 19.5;
            })
            .text(function(d) {
                return d;
            });

        routeButton.append("rect")
            .attr({
                class: "dataSwitch",
                height: 26,
                width: 26
            })
            .attr("x", function(d, i) {
                return 208 + Math.floor(i / 9) * 26;
            })
            .attr("y", function(d, i) {
                return (i % 9) * 26;
            })
            .on("click", function(d) {
                if(activeRoutes.indexOf(d) !== -1) {
                    d3.select(this.parentNode)
                        .select("rect.dataSwitchBG")
                        .attr("fill", "#000000");
                    d3.select(this.parentNode)
                        .select("text.dataSwitchText")
                        .attr("fill", "#FFFFFF");
                    activeRoutes.splice(activeRoutes.indexOf(d),1);
                    updateDisplays(data);
                }
                else {
                    d3.select(this.parentNode)
                        .select("rect.dataSwitchBG")
                        .attr("fill", routeColors[d]);
                    d3.select(this.parentNode)
                        .select("text.dataSwitchText")
                        .attr("fill", "#000000");
                    activeRoutes.push(d);
                    updateDisplays(data);
                }
            })
            .on("mouseover", function(d) {
                routeInfoDisplay.append("text")
                    .attr({
                        class: "routeInfoHeader",
                        x: 15,
                        y: 15
                    })
                    .text(d + " Line");
                
                routeInfoDisplay.append("text")
                    .attr({
                        class: "routeInfoText",
                        x: 15,
                        y: 30
                    })
                    .text(routeDescriptions[d]);
            
                routeInfoDisplay.append("text")
                    .attr({
                        class: "routeInfoText",
                        "text-anchor": "end",
                        x: 260,
                        y: 15
                    })
                    .text(routeTerminals[d]);
            })
            .on("mouseout", function(d) {
                routeInfoDisplay.selectAll("text")
                    .remove();
            });

        var dayButton = controlDisplay.append("g")
            .selectAll("g")
            .data(activeDays)
            .enter()
            .append("g");

        dayButton.append("rect")
            .attr({
                class: "dataSwitchBG",
                height: 26,
                width: 26,
                fill: "#FFFFFF"
            })
            .attr("x", function(d, i) {
                return 182 + Math.floor(i / 9) * 26;
            })
            .attr("y", function(d, i) {
                return 26 + (i % 9) * 26;
            });

        dayButton.append("text")
            .attr("class", "dataSwitchText")
            .attr("x", function(d, i) {
                return 182 + Math.floor(i / 9) * 26 + 13;
            })
            .attr("y", function(d, i) {
                return 26 + (i % 9) * 26 + 19.5;
            })
            .text(function(d) {
                return dayNames[d];
            });

        dayButton.append("rect")
            .attr({
                class: "dataSwitch",
                height: 26,
                width: 26
            })
            .attr("x", function(d, i) {
                return 182 + Math.floor(i / 9) * 26;
            })
            .attr("y", function(d, i) {
                return 26 + (i % 9) * 26;
            })
            .on("click", function(d) {
                if(activeDays.indexOf(d) !== -1) {
                    d3.select(this.parentNode)
                        .select("rect.dataSwitchBG")
                        .attr("fill", "#000000");
                    d3.select(this.parentNode)
                        .select("text.dataSwitchText")
                        .attr("fill", "#FFFFFF");
                    activeDays.splice(activeDays.indexOf(d),1);
                    updateDisplays(data);
                }
                else {
                    d3.select(this.parentNode)
                        .select("rect.dataSwitchBG")
                        .attr("fill", "#FFFFFF");
                    d3.select(this.parentNode)
                        .select("text.dataSwitchText")
                        .attr("fill", "#000000");
                    activeDays.push(d);
                    updateDisplays(data);
                }
            });
    }
});