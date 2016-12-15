
var CSTree = function(config){
	var margin 	= config.margin;
	var width	= config.width - margin.left - margin.right;
	var height 	= config.height - margin.top - margin.bottom;
	var selected = null;
	var i = 0,
    duration = 750,
    root = config.data,
    nodes=null, links=null, filter=config.filter;
    var df = d3.format(".4f");

    var size = d3.scale.linear();
    var fsize = d3.scale.linear();
    var doiLabel = config.useDOILabel;

	var tree = d3.layout.tree()
	    .size([height, width]);

	var diagonal = d3.svg.diagonal()
	    .projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select(config.container).append("svg")
	    .attr("width", width + margin.right + margin.left)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  root.x0 = height / 2;
	  root.y0 = 0;

	function chart(){

	}

	chart.useDOILabel = function(enabled){
		doiLabel = enabled;
	}
  	chart.collapse = function (d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(chart.collapse);
			d.children = null;
		}
  	}
  	chart.create = function(){
  		console.log(root)
		root.children.forEach(chart.collapse);
		chart.update(root);
  	}

	//d3.select(self.frameElement).style("height", "800px");
	chart.update = function (source) {
		// Compute the new tree layout.
		nodes = tree.nodes(root).reverse(),
		  	links = tree.links(nodes);
		  	//console.log(nodes);
		// Normalize for fixed-depth.
		nodes.forEach(function(d) { d.y = d.depth * 180; });

		// Calculate DOI values
		filter.operate(nodes, root, 5, root.approved)
		var params = filter.getParams();
		var min =  -d3.max(nodes, function(d){ return d.depth+1;});
		min -= params.isLocalOn? 1: 0;
		min -= params.isSocialOn? params.weight*root.visitRatio: 0;
		//Update scale
		size.domain([min, 0])
			.range([2, 10])

		fsize.domain([min, 0])
			.range([8, 14])

		console.log("scale test:")
        console.log(1e-6);

		// Update the nodes…
		var node = svg.selectAll("g.node")
		  	.data(nodes, function(d) { return d.id || (d.id = ++i); });
		node.transition().select("text")	
			.text(function(d) { return doiLabel? df(d.doi) : d.name; });//return d.name + "("+nodes.indexOf(d)+", " +df(d.doi)+")"; })

		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("g")
		  	.attr("class", "node")
		  	//.style("opacity", 1e-6)
		  	.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		 	.on("click", chart.click)
		 	.on('mouseover', chart.onMouseOver)
	      	.on('mouseout', chart.onMouseOut);;

		nodeEnter.append("circle")
		 	.attr("r", 1e-6)
		  	.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

		nodeEnter.append("text")
			.attr("x", function(d) { return -10; })
			.attr("dy", ".35em")
			.attr("text-anchor", function(d) { return  "end" ; })
			.text(function(d) { return doiLabel? df(d.doi) : d.name; }) //{ return d.name + "("+nodes.indexOf(d)+", " +df(d.doi)+")"; })
			.style("fill-opacity", 1e-6)
			.style("font-size", "0px");

		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
		  	.duration(duration)
		  	//.style("opacity", function(d){ return alpha(d.doi); })
		  	.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

		nodeUpdate.select("circle")
		  	.attr("r", function(d) { return size(d.doi); })
		  	.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

		nodeUpdate.select("text")
		  	.style("fill-opacity", 1)
		  	.style("font-size", function(d) { return fsize(d.doi)+"px";});

		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
		  	.duration(duration)
		  	.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		  	.remove();

		nodeExit.select("circle")
		  	.attr("r", 1e-6);

		nodeExit.select("text")
		  	.style("fill-opacity", 1e-6);
		  	

		// Update the links…
		var link = svg.selectAll("path.link")
		  	.data(links, function(d) { return d.target.id; });

		// Enter any new links at the parent's previous position.
		link.enter().insert("path", "g")
		  	.attr("class", "link")
		  	.attr("d", function(d) {
		    	var o = {x: source.x0, y: source.y0};
		    	return diagonal({source: o, target: o});
		  	});

		// Transition links to their new position.
		link.transition()
		  	.duration(duration)
		  	.attr("d", diagonal);

		// Transition exiting nodes to the parent's new position.
		link.exit().transition()
			.duration(duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return diagonal({source: o, target: o});
		  	})
	  	.remove();

		// Stash the old positions for transition.
		nodes.forEach(function(d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	}
// Toggle children on click.
	chart.click = function (d) {
		// console.log('clicked:' )
		// console.log(d)
		// Add a focus node
		if (filter){
			var f = filter.focusNodes();
			if (f.length>0)
				f.pop();
			f.push(d);

		}
		if (d.children) {
	    	d._children = d.children;
	    	d.children = null;
	  	} else {
	    	d.children = d._children;
	    	d._children = null;
	  	}	
	  	chart.update(d);
	  	//selection
	  	if (selected){//disable highlight	
	  		chart.disableHighlight(selected);		
	  	}
	  	
  		selected = this;
  		chart.enableHighlight(this);
	  	config.onClick.call(this, d);
	}
	chart.onMouseOut = function(d){
		if (this!= selected) chart.disableHighlight(this);
	}
	chart.onMouseOver = function(d){
		if (this!= selected) chart.enableHighlight(this);		
	}
	chart.enableHighlight = function(elem){
		d3.select(elem).select("circle")
			.style("stroke", "orange");
		d3.select(elem).select("text")
			.style("fill", "orange");
	}
	chart.disableHighlight = function(elem){
		d3.select(elem).select("circle")
  			.style("stroke", "steelblue");
		d3.select(elem).select("text")
			.style("fill", "black");
	}
	return chart;
}





