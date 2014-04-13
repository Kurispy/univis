// Width and height of the svg
var width = 500;
var height = 100;

var svg = d3.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

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
			})
		})
		.entries(data);
	
	var scale = d3.scale.linear()
		.domain([0, d3.max(byRoute, function(d) { return d.values; })])
		.range([0, height]);
	
	var rects = svg.selectAll("rect")
		.data(byRoute)
		.enter()
		.append("rect")
		.attr("x", function(d, i) {
			return i * (width / byRoute.length)
		})
		.attr("y", function(d) {
			return height - scale(d.values);
		})
		.attr("width", width / byRoute.length - 1)
		.attr("height", function(d) {
			return scale(d.values);
		})
		.attr("fill", "cyan");
	
	

	//d3.select("body")
//      .selectAll("p")
//	  .data(byRoute)
//	  .enter()
//	  .append("p")
//      .text(function(d) {
//	  	return d3.values(d);
//	  });
}