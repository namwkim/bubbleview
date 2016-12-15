!function() {
  var nw = {
    version: "0.0.1"
  };
  nw.layout = {};
  nw.layout.tree = function() {
    var hierarchy = nw.layout.hierarchy().sort(null).value(null), separation = nw_layout_treeSeparation, size = [ 1, 1 ], nodeSize = [ 1, 1 ], canvasSize = [ 1, 1 ];
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i);//, root0 = nodes[0], root1 = wrapTree(root0);
      console.log("before filtering:" + nodes.length);
      nodes = doilayout(nodes[0]);
      // nw_layout_hierarchyVisitAfter(root1, firstWalk), root1.parent.m = -root1.z;
      // nw_layout_hierarchyVisitBefore(root1, secondWalk);
      // if (nodeSize) 
      //   nw_layout_hierarchyVisitBefore(root0, sizeNode); 
      // else {
      //   var left = root0, right = root0, bottom = root0;
      //   nw_layout_hierarchyVisitBefore(root0, function(node) {
      //     if (node.x < left.x) left = node;
      //     if (node.x > right.x) right = node;
      //     if (node.depth > bottom.depth) bottom = node;
      //   });
      //   var tx = separation(left, right) / 2 - left.x, kx = size[0] / (right.x + separation(right, left) / 2 + tx), ky = size[1] / (bottom.depth || 1);
      //   nw_layout_hierarchyVisitBefore(root0, function(node) {
      //     node.x = (node.x + tx) * kx;
      //     node.y = node.depth * ky;
      //   });
      // }
      console.log("after filtering:" + nodes.length);
      return nodes;
    }
    function doilayout(root){
      // construct blocks **********************************************************************
      // var offsets = [0];
      var block = { //centering the root block
        //x0: canvasSize[0]/2,
        height: nodeSize[0],
        // y0: 0,
        parent: null,
        removed:false,
        //childBlocks: [],
        nodes: [root]
      };
      root.block = block;
      var blocks = [[block]];
      root.x = canvasSize[0]/2;
      root.y = 0;
      var stack = [ root ];
      var n; 
      while ((n = stack.shift()) != null) {
        //construct a child block 
        var cDepth = n.depth+1;

        block = {
            //x0: offsets[cDepth],
            height: 0,
            // y0: cDepth*nodeSize[1],
            parent: n,
            removed:false,
            nodes: []
          };   
        for (var i in n.children){
          //position inner nodes
          if (n.children[i].visible==false) continue;
          n.children[i].block = block;
          block.height += nodeSize[0];
          block.nodes.push(n.children[i]);
          if (n.children[i].children) stack.push(n.children[i]); // save for next travesal
        }
        if (block.nodes.length==0) continue;
        block.height += nodeSize[0];
        //block.height += nodeSize[0]; //padding
        //offsets[cDepth] += (block.height + 2*nodeSize[0])//space between blocks        
        if (blocks.length<=cDepth){//create a new list for a new depth level
          blocks.push([]);
          //offsets.push(0);
        }
        blocks[cDepth].push(block);       

      }
      console.log(blocks);
      
      var height = canvasSize[0];
      // fitting a screen size *****************************************************************************
      for (var depth in blocks){
        var depthBlocks = blocks[depth];//retrieve blocks for the depth
        //readjust blocks
        var depthNodes = [];
        // if parent node has been collapsed
        for (var i in depthBlocks){
          var block = depthBlocks[i];
          // console.log(block.parent)
          if (block.parent && (block.parent.collapsed==true || block.parent.visible==false)){
            //remove blocks
            block.nodes.forEach(function(d){
               // console.log("child visible changed: " + d.name)
              d.visible = false;
            })
            // console.log("parent block not visible: " + block.parent.name);
            //depthBlocks.splice(depthBlocks.indexOf(block), 1);  
            block.removed = true;  
            continue;    
          }
          if (block.removed) continue;
          depthNodes = depthNodes.concat(block.nodes);//contain visible nodes.
        }

        // filter lowest doi nodes 
        var sorted = depthNodes.sort(function(a, b){  return b.doi-a.doi; });
        var h = nw.sum(depthBlocks, function(d){ return d.removed? 0: d.height; }); //nw.max(depthBlocks, function(d){ return d.x1; }) - nw.min(depthBlocks, function(d){ return d.x0; });
        var n;
        console.log("height, limit: " +h + ", " + height);
        while((h > height) && (n = sorted.pop()) ){
          

          n.visible = false; // n's child block will be removed above
          // recalculate the block height
          n.block.height -= nodeSize[0];

           // console.log("visible chaned: " + n.name);
          var removed = n.block.nodes.splice(n.block.nodes.indexOf(n), 1)[0];
          //console.log(removed)
          //is collapsed
          if (n.block.nodes.length==0 || (n.block.nodes.length==1 && n.block.nodes[0].isElided==true) ){
            n.parent.collapsed = true;     
            if (n.block.nodes.length==1) n.block.nodes[0].visible = false; //elided node
            //depthBlocks.splice(depthBlocks.indexOf(n.block), 1);  //this block needs to be removed
            //delete n.parent.children;
            n.block.removed = true;
          }
          if (n.parent.collapsed==false && n.parent.hasElided==false){//only after an element removed first time
            n.parent.hasElided = true;
            var elided = {
              name: "<..1 items..>",
              doi: n.doi, //min doi
              approved: 0,
              parent : n.parent,
              isElided : true,
              collapsed: false,
              visible: true,
              depth:n.depth,
              elidedNodes: [removed]
            }
            n.block.height += nodeSize[0];
            n.block.nodes.push(elided); //add it to block
            n.parent.children.push(elided);
          }else if(n.parent.collapsed==false){
            var elided = n.block.nodes[n.block.nodes.length-1];
            // console.log(removed.name);
            elided.elidedNodes.push(removed);
            elided.name = "<.." + elided.elidedNodes.length + " items..>";
          }
          
          // recalculate the height of all blocks within this depth
          h = nw.sum(depthBlocks, function(d){ return d.removed? 0: d.height; });
          //console.log("height, limit (left): " +h + ", " + height + " (" + sorted.length + " ) ");
        }
      }
      //console.log(blocks);
      //position assignments
      var nodes = [];
      for (var depth in blocks){
        var depthBlocks = blocks[depth];//retrieve blocks for the depth
        
        h = nw.sum(depthBlocks, function(d){ return d.removed? 0: d.height; });

        // initial position set to close to the parent
        var curX = 0;
        var prevBlock = null;
         // console.log("start height(depth): " + h + " (" + depth + ")");
        for (var i in depthBlocks){
          
          var block = depthBlocks[i];
          if (block.removed) continue;
          if (block.parent){
            // console.log("width: " + block.width);
            block.x = block.parent.x - block.height/2 + nodeSize[0]/2;
            if (block.x<0) block.x = 0;
          }else{
            block.x = canvasSize[0]/2; //centering if no parent (= root)
          }
          if (prevBlock && (prevBlock.x+prevBlock.height)>block.x){//overlap with previous one
            var diff = (prevBlock.x+prevBlock.height)-block.x;
            block.x += diff; //avoid overlap by pushing downward
          }
          //check remaining space
          var remaining = height - (block.x + block.height);
          var needed    = h - block.height;
          //console.log("re, ne = " + remaining + ", " + needed);
          if (remaining<needed){
            var diff = needed - remaining;
            block.x -=diff; //push to the edge
          }
          // console.log(block.x);
          curX = block.x + nodeSize[0]/2;
          for (var i in block.nodes){
            block.nodes[i].x = curX;
            block.nodes[i].y = block.nodes[i].depth*nodeSize[1];
            curX += nodeSize[0];
            // if (block.nodes[i].visible==false) console.log('non-visible node found: ' + block.nodes[i].name);
          }
          //curX += nodeSize[0];
          nodes = nodes.concat(block.nodes);
          prevBlock = block;
          h-=block.height; //update remaining height
          // console.log("height: " + h);
        }
      }

      return nodes;
      // var queue = [];
      // queue.push(root);

      // offsets = [0];
      
      // while (queue.length>0){
      //   var n = queue.shift();
      //   //console.log(n)
      //   if (offsets.length <= n.depth){
      //     offsets.push(0);
      //   }
      //   //console.log(offsets)
      //   n.x = offsets[n.depth];
      //   n.y = n.depth * nodeSize[1];
      //   //console.log(n.name);
      //   offsets[n.depth]+=nodeSize[0];
      //   if (n.children ){
      //     for (var i in n.children){
      //       queue.push(n.children[i]);
      //     }
      //   }        
      // }


    }

    function wrapTree(root0) {
      var root1 = {
        A: null,
        children: [ root0 ]
      }, queue = [ root1 ], node1;
      while ((node1 = queue.pop()) != null) {
        for (var children = node1.children, child, i = 0, n = children.length; i < n; ++i) {
          queue.push((children[i] = child = {
            _: children[i],
            parent: node1,
            children: (child = children[i].children) && child.slice() || [],
            A: null,
            a: null,
            z: 0,
            m: 0,
            c: 0,
            s: 0,
            t: null,
            i: i
          }).a = child);
        }
      }
      return root1.children[0];
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children.length) {
        nw_layout_treeShift(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = nw_layout_treeRight(vim), vip = nw_layout_treeLeft(vip), vim && vip) {
          vom = nw_layout_treeLeft(vom);
          vop = nw_layout_treeRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            nw_layout_treeMove(nw_layout_treeAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !nw_layout_treeRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !nw_layout_treeLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= size[0];
      node.y = node.depth * size[1];
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      // if (!arguments.length) return nodeSize ? null : size;
      // nodeSize = (size = x) == null ? sizeNode : null;
      // return tree;
    };
    tree.canvasSize = function(x){
      canvasSize = x;
      return tree;
    }
    tree.nodeSize = function(x) {
      // if (!arguments.length) return nodeSize ? size : null;
      // nodeSize = (size = x) == null ? null : sizeNode;
      nodeSize = x;
      return tree;
    };
    return nw_layout_hierarchyRebind(tree, hierarchy);
  };
  function nw_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function nw_layout_treeLeft(v) {
    var children = v.children;
    return children.length ? children[0] : v.t;
  }
  function nw_layout_treeRight(v) {
    var children = v.children, n;
    return (n = children.length) ? children[n - 1] : v.t;
  }
  function nw_layout_treeMove(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function nw_layout_treeShift(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function nw_layout_treeAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  nw.layout.hierarchy = function() {
    var sort = nw_layout_hierarchySort, children = nw_layout_hierarchyChildren, value = nw_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      nw_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        nw_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        nw_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function nw_layout_hierarchyRebind(object, hierarchy) {
    nw.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = nw_layout_hierarchyLinks;
    return object;
  }
  function nw_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function nw_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function nw_layout_hierarchyChildren(d) {
    return d.children;
  }
  function nw_layout_hierarchyValue(d) {
    return d.value;
  }
  function nw_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function nw_layout_hierarchyLinks(nodes) {
    return nw.merge(nodes.map(function(parent) {
      return (parent.children || []).filter(function(c){ return c.visible; }).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  nw.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  nw.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  nw.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (nw_numeric(a = +array[i])) s += a;
    } else {
      while (++i < n) if (nw_numeric(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  nw.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  }
  nw.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = nw_rebind(target, source, source[method]);
    return target;
  };
  function nw_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function nw_numeric(x) {
    return !isNaN(x);
  }

  this.nw = nw;
}();