// Width and height of the svg
var w = 1000;
var h = 500;
var pad = 3;

var svg = d3.select("body")
	.append("svg")
	.attr("width", w)
	.attr("height", h);

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
		.range([0, h]);
        
        var rgbScale = d3.scale.linear()
		.domain([0, d3.max(byRoute, function(d) { return d.values; })])
		.range([0, 255]);
	
	var rects = svg.selectAll("rect")
		.data(byRoute)
		.enter()
		.append("rect")
		.attr("x", function(d, i) {
			return i * (w / byRoute.length);
		})
		.attr("y", function(d) {
			return h - sizeScale(d.values);
		})
		.attr("width", w / byRoute.length - pad)
		.attr("height", function(d) {
			return sizeScale(d.values);
		})
		.attr("fill", function(d) {
                    return "rgb(0, " + d3.round(rgbScale(d.values)) + ", 0)";
                });
}