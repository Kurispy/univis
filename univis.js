var pad = 1;

var canvas = d3.select("body")
	.append("svg")
	.attr("class", "canvas");

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
	
	var rects = canvas.selectAll("rect")
		.data(byRoute)
		.enter()
		.append("rect")
                .on("mouseover", function(d) {
                    d3.select(this)
                    .attr("stroke", "red");
            
                    canvas.append("text")
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
                    return i * (100 / byRoute.length) + "%";
		})
		.attr("y", function(d) {
                    return 100 - sizeScale(d.values) + "%";
		})
		.attr("width", (100 / byRoute.length - pad) + "%")
		.attr("height", function(d) {
                    return sizeScale(d.values) + "%";
		})
		.attr("fill", function(d) {
                    return "rgb(0, " + d3.round(rgbScale(d.values)) + ", 0)";
                });
}