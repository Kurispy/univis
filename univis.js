var barPad = 1;

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
}, display);

// Main data display function
function display(data) {
	var byRoute = d3.nest()
		.key(function(d) { return d.route; })
		.sortKeys(d3.ascending)
		.rollup(function(d) {
			return d3.sum(d, function(b) { 
				return b.boarding;
			});
		})
		.entries(data);
        
        byRoute.sort(function(a, b) {
            return d3.descending(a.values, b.values);
        });
	
	var sizeScale = d3.scale.linear()
		.domain([0, d3.max(byRoute, function(d) { return d.values; })])
		.range([0, 100]);
        
        var rgbScale = d3.scale.linear()
		.domain([0, d3.max(byRoute, function(d) { return d.values; })])
		.range([0, 255]);
	
	var rects = passCountDisplay.selectAll("rect")
		.data(byRoute)
		.enter()
		.append("rect")
                .on("mouseover", function(d) {
                    d3.select(this)
                            .attr("stroke", "red");
            
                    passCountDisplay.append("text")
                            .attr("x", "50%")
                            .attr("y", "25%")
                            .text(d.key + " " + d.values);
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                    .attr("stroke", null);
            
                    d3.selectAll("text")
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
                    return "rgb(0, " + d3.round(rgbScale(d.values)) + ", 0)";
                });
}