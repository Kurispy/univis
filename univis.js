var barPad = 1;
var activeRoutes = ["A", "B", "C", "D", "E", "F", "G", "J", "K", "L", "M", 
        "O", "P", "Q", "S", "T", "V", "W"];
var activeDays = [0, 1, 2, 3, 4, 5, 6];
var routeColors = {A:"#F0649E", B:"#50863D", C:"#A86B79", D:"#0B7BC0",
    E:"#60BB46", F:"#825DA8", G:"#51929F", J:"#D6A477", K:"#F26524",
    L:"#F79420", M:"#C33F97", O:"#754D25", P:"#D52D27", Q:"#D52D27",
    S:"#808285", T:"#EE2E24", V:"#FFCE0D", W:"#118D9B"};

// Main display, contains all other displays
var canvas = d3.select("body")
    .append("svg")
    .attr({
        height: "100%",
        width: "100%",
        viewBox: "0 0 960 560"
    });

// Displays a map with bus route overlays
var mapDisplay = canvas.append("svg")
    .attr({
        x: 0,
        y: 0,
        width: 700,
        height: 365
    });

// Displays a graph of passengers vs. bus line
var passCountDisplay = canvas.append("svg")
    .attr({
        x: 0,
        y: 365,
        width: 480,
        height: 195
    });

// Displays a graph of how many passengers boarded/deboarded at a stop
var stopInfoDisplay = canvas.append("svg")
    .attr({
        x: 480,
        y: 365,
        width: 480,
        height: 195
    });

// Contains controls for manipulating what data is displayed
var controlDisplay = canvas.append("svg")
    .attr({
        x: 700,
        y: 0,
        width: 260,
        height: 260
    });

// Contains info about the currently selected route
var routeInfoDisplay = canvas.append("svg")
    .attr({
        x: 700,
        y: 260,
        width: 260,
        height: 105
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
}, init);

// Main display function
function init(data) {
    var routeButton = controlDisplay.selectAll("g")
        .data(activeRoutes)
        .enter()
        .append("g");
    
    routeButton.append("rect")
        .attr("class", "routeSwitchBG")
        .attr("height", 26)
        .attr("width", 26)
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
        .attr("class", "routeSwitchName")
        .attr("user-select", "none")
        .attr("text-anchor", "middle")
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
        .attr("class", "routeSwitch")
        .attr("height", 26)
        .attr("width", 26)
        .attr("fill-opacity", 0)
        .attr("x", function(d, i) {
            return 208 + Math.floor(i / 9) * 26;
        })
        .attr("y", function(d, i) {
            return (i % 9) * 26;
        })
        .on("click", function(d) {
            if(activeRoutes.indexOf(d) !== -1) {
                activeRoutes.splice(activeRoutes.indexOf(d),1);
                updateDisplays(data);
            }
            else {
                activeRoutes.push(d);
                updateDisplays(data);
            }
        });
    
    // Examine current settings to see what data is active
    
    updateDisplays(data);
}

function updateDisplays(data) {
    console.log(activeRoutes);
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

    var rgbScale = d3.scale.linear()
        .domain([0, d3.max(byRoute, function(d) { return d.values; })])
        .range([0, 255]);

    // Bars
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
        
    passCountDisplay.selectAll("rect")
        .data(byRoute)
        .exit()
        .remove();
}