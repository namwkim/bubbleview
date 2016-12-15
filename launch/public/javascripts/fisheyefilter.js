var FisheyeFilter = function (s, l, f, w) {

	var nodes, root, distance, divisor, focusNodes=[];
    var isSocialOn  = s;
    var isLocalOn   = l;  
    var isFocusOn   = f;
    var weight= w;
	function filter(){

	}
	filter.focusNodes = function(){
		return focusNodes;
	}
    filter.setParams = function(s, l, f, w){
        isSocialOn  = s;
        isLocalOn   = l;  
        isFocusOn   = f;
        weight= w;        
    }
    filter.getParams = function(){
        return {
            isSocialOn: isSocialOn,
            isLocalOn: isLocalOn,
            isFocusOn, isFocusOn,
            weight, weight

        }
    }


	filter.operate = function(r, d, dsr){
		var stack = [r];
        nodes = [r];
        while ((node = stack.pop()) != null) {
          if ((children = node.children) && (n = children.length)) {
            var n, children;
            while (--n >= 0) {
                stack.push(children[n]);
                nodes.push(children[n])
            }
          }
        }

		root 		= r;
		distance 	= d;
		divisor = dsr;

		// mark the items
		for (var i in nodes){
			nodes[i].doi = -9999; //replace javascript max
		}
        // compute the fisheye over nodes
        //console.log('foci:')
        //console.log(focusNodes);
        if (isFocusOn){
            for (var i in focusNodes) {

                filter.visitFocus(focusNodes[i], null);
            }            
        }
        //console.log("Focus")
        filter.visitFocus(root, null);

		// mark unreached items
		for (var i in nodes){
			if (nodes[i].doi == -9999){
				filter.setVisibility(nodes[i], false);
			}
		}
	}
	filter.setVisibility = function(node, visible){
		//expanded?
		node.collapsed 	= (node.doi <= -distance);
		node.visible 	= visible;
	}
	/**
     * Visit a focus node.
     */
    filter.visitFocus  = function (n, c)
    {
        if (n.doi <= -1 ) {
            filter.visit(n, c, 0, 0, 0);
            if (distance > 0) filter.visitDescendants(n, c, -1);
            filter.visitAncestors(n);
        }
    }
    /**
     * Visit a specific node and update its degree-of-interest.
     */
    filter.visit = function(n, c, doi, localDOI, socialDOI)
    {
    	
        //var localDOI = -ldist;//Math.min(1000.0, divisor);
        // console.log("DOI: " + doi);
        // console.log("localDOI: " + localDOI);
        // console.log("visitCnt: " + (doi + localDOI+n.visitCnt));
        if (n.expand){
            n.expand = false;  
            n.doi = n.oldDOI + distance/2; 
            console.log("dist " + n.doi);   
        }else{
            n.doi = doi + localDOI + socialDOI;    
        }
        
        filter.setVisibility(n, true);
        //console.log(n.name + ": " + socialDOI);
        //console.log(n.name + ": " + doi + ", " + localDOI)
        // InEdge DOI 
        // if (c != null) {
        // 	var e = c.parentEdge;
        // 	e.doi = c.doi;
        // 	filter.setVisibility(e, true);
        // }
    }
    /**
     * Visit tree ancestors and their other descendants.
     */
    filter.visitAncestors = function(n)
    {
        if (n == root) return;
        filter.visitFocus(n.parent, n);
    }
    
    /**
     * Traverse tree descendents.
     */
    filter.visitDescendants = function (p, skip, dist)
    {
    	var lidx = nodes.indexOf(p);//(skip == null ? 0 : nodes.indexOf(skip.parent));
    	//console.log("p index: " + lidx);
        p.expanded = p.children? p.children.length > 0 : false;
        for (var i in p.children) {
        	var c = p.children[i];
        	if (c == skip) continue;
        	
        	var globalDOI = dist;//Math.ceil(p.doi - 1);
        	//console.log(c.name + "' dist: " + Math.abs(lidx-i));
        	
           
        	filter.visit(c, c, globalDOI, 
                isLocalOn? (-i/p.children.length)*0.1:0,
                isSocialOn? (-c.visitDOI*weight):0);//-c.approved/p.approved);//Math.abs(lidx-i));
        	if (globalDOI > -distance) filter.visitDescendants(c, null, globalDOI-1);
        }
    }
	return filter;

}