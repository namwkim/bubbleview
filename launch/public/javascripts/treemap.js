var ZoomableTreemap = function(config){
	var margin 	= config.margin;
	var width	= config.width - margin.left - margin.right;
	var height 	= config.height - margin.top - margin.bottom;
	var formatNumber = d3.format(",d")
	var transitioning, root;

	var x = d3.scale.linear(), 
		y= d3.scale.linear(), 
		treemap = d3.layout.treemap()
		    .children(function(d, depth) { return depth ? null : d._children; })
		    .sort(function(a, b) { return a.value - b.value; })
		    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
		    .round(false), 
		svg = d3.select(config.container).append("svg")
			.attr("class", "treemap")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.bottom + margin.top)
		    .style("margin-left", -margin.left + "px")
		    .style("margin-right", -margin.right + "px")
		.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		    .style("shape-rendering", "crispEdges");
		
		grandparent = svg.append("g")
		    .attr("class", "grandparent");

		grandparent.append("rect")
		    .attr("y", -margin.top)
		    .attr("width", width)
		    .attr("height", margin.top);

		grandparent.append("text")
		    .attr("x", 6)
		    .attr("y", 6 - margin.top)
		    .attr("dy", ".75em");
		    
	function chart(){

	}
	chart.create = function(){
		this.update(config.data, width, height)
	}
	chart.update = function(d, w, h){
		root = d;	width = w;	height = h;

		x.domain([0, width])
			.range([0, width]);

		y.domain([0, height])
		    .range([0, height]);

		d3.select(config.container).select(".treemap")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.bottom + margin.top)

		grandparent.select("rect")
		    .attr("width", width)
		    .attr("height", margin.top);

		this.initialize(root);
		this.accumulate(root);
		this.layout(root);
		this.display(root);
	}
	chart.initialize = function(root) {
	    root.x = root.y = 0;
	    root.dx = width;
	    root.dy = height;
	    root.depth = 0;
  	}

	// Aggregate the values for internal nodes. This is normally done by the
	// treemap layout, but not here because of our custom implementation.
	// We also take a snapshot of the original children (_children) to avoid
	// the children being overwritten when when layout is computed.
	chart.accumulate  = function (d) {
		return (d._children = d.values)
			? d.value = d.values.reduce(function(p, v) { return p + chart.accumulate(v); }, 0)
		    : d.value;
	}

	// Compute the treemap layout recursively such that each group of siblings
	// uses the same size (1×1) rather than the dimensions of the parent cell.
	// This optimizes the layout for the current zoom state. Note that a wrapper
	// object is created for the parent node for each group of siblings so that
	// the parent’s dimensions are not discarded as we recurse. Since each group
	// of sibling was laid out in 1×1, we must rescale to fit using absolute
	// coordinates. This lets us use a viewport to zoom.
	chart.layout  = function(d) {
	if (d._children) {
			treemap.nodes({_children: d._children});
			d._children.forEach(function(c) {
			c.x = d.x + c.x * d.dx;
			c.y = d.y + c.y * d.dy;
			c.dx *= d.dx;
			c.dy *= d.dy;
			c.parent = d;
			chart.layout(c);
		});
	} 
  	}

	chart.display  = function (d) {
		console.log(d.parent)
		grandparent
		    .datum(d.parent)
		    .on("click", transition)
		  .select("text")
		    .text(chart.getName(d));
		   
		var g1 = svg.insert("g", ".grandparent")
		    .datum(d)
		    .attr("class", "depth");
		console.log(d)
		var g = g1.selectAll("g")
		    .data(d._children)
		  .enter().append("g");


		g.filter(function(d) { return d._children; })
		    .classed("children", true)
		    .on("click", transition);

		g.selectAll(".child")
		    .data(function(d) { return d._children || [d]; })
		  .enter().append("rect")
		    .attr("class", "child")
		    .call(chart.setRect);

		g.append("rect")
		    .attr("class", "parent")
		    .call(chart.setRect)
		  .append("title")
		    .text(function(d) { return formatNumber(d.value); });

		g.append("text")
		    .attr("dy", ".75em")
		    .text(function(d) { return d.key; })
		    .call(chart.setText);

		function transition(d) {
			if (transitioning || !d) return;
			transitioning = true;

			var g2 = chart.display(d),
		  		t1 = g1.transition().duration(750),
		  		t2 = g2.transition().duration(750);

			// Update the domain only after entering new elements.
			x.domain([d.x, d.x + d.dx]);
			y.domain([d.y, d.y + d.dy]);

			// Enable anti-aliasing during the transition.
			svg.style("shape-rendering", null);

			// Draw child nodes on top of parent nodes.
			svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

			// Fade-in entering text.
			g2.selectAll("text").style("fill-opacity", 0);

			// Transition to the new view.
			t1.selectAll("text").call(chart.setText).style("fill-opacity", 0);
			t2.selectAll("text").call(chart.setText).style("fill-opacity", 1);
			t1.selectAll("rect").call(chart.setRect);
			t2.selectAll("rect").call(chart.setRect);

			// Remove the old node when the transition is finished.
			t1.remove().each("end", function() {
				svg.style("shape-rendering", "crispEdges");
				transitioning = false;
			});
		}
		return g;
	}

	chart.setText  = function (text) {
		text.attr("x", function(d) { return x(d.x) + 6; })
		    .attr("y", function(d) { return y(d.y) + 6; });
	}

  	chart.setRect  = function (rect) {
	    rect.attr("x", function(d) { return x(d.x); })
	        .attr("y", function(d) { return y(d.y); })
	        .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
	        .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
  	}

	chart.getName  = function (d) {
		return d.parent
		    ? this.getName(d.parent) + "." + d.key
		    : d.key;
	}
	return chart;
}

