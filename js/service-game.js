/* Game logic service */

angular.module('Icebreakr.game', [])
.factory('gameUtility', function(colorUtility) {
    var randomIntRange = function(min,max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    var randomRange = function(min,max) {
        return Math.random() * (max-min) + min;
    };
    var toRadians = function(angle) {
        return angle * 0.0174533;
    };
    var toDegrees = function(angle) {
        return (angle * 57.2957795 + 360) % 360;
    };
    var getDigit = function(num, digit) {
        return Math.floor(num / (Math.pow(10, digit-1)) % 10)
    };
    var getNeighbors = function(loc,dist) { // Check a diamond area around x,y
        var neighbors = [];
        loc = [parseInt(loc[0]),parseInt(loc[1])];
        for(var i = dist*-1; i <= dist; i++) {
            for(var ii = dist*-1; ii <= dist; ii++) {
                var total = Math.abs(i)+Math.abs(ii);
                if(total <= dist && total > 0) {
                    neighbors.push((loc[0]+i)+':'+(loc[1]+ii));
                }
            }
        }
        return neighbors;
    };
    var getBoxNeighbors = function(nodes,x,y,dist) { // Check a box area around x,y
        var neighbors = [];
        x = parseInt(x); y = parseInt(y);
        for(var i = dist*-1; i <= dist; i++) {
            for(var ii = dist*-1; ii <= dist; ii++) {
                var nx = (x+i), ny = (y+ii);
                if(nodes.hasOwnProperty(nx+':'+ny)) {neighbors.push(nx+':'+ny); }
            }
        }
        return neighbors;
    };
    var getCircle = function(nodes,x,y,dist) { // Check circular area around x,y
        var neighbors = [];
        x = parseInt(x); y = parseInt(y);
        for(var i = dist*-1; i <= dist; i++) {
            for(var ii = dist*-1; ii <= dist; ii++) {
                var nx = (x+i), ny = (y+ii);
                if(dist*dist > i*i + ii*ii && nodes.hasOwnProperty(nx+':'+ny)) {
                    neighbors.push(nx+':'+ny); 
                }
            }
        }
        return neighbors;
    };
    var stressNodes = function(nodes) { // Thanks morgs
        for(var i = 0; i < nodes.length; i++) {
            nodes[i].depth++;
        }
        return nodes;
    };
    return {
        tapNode: function(nodes,ox,oy) { // ox and oy are the clicked coords
            Math.seedrandom(); console.log('TAP!');
            var theTime = new Date().getTime();
            var oCoords = ''; // Origin node coordinates (will use nearby node if possible)
            var newNodes = {}; // New nodes to be returned
            var dist = 0, angle = 0, ndx = 0, ndy = 0, newNode = '';
            if(!nodes) { nodes = {}; } // If there are no nodes, create a blank nodes object
            
            // If no nearby nodes, create new node with possible children
            if(getCircle(nodes,ox,oy,6).length == 0) { // No nearby nodes
                var newNodeDepth = randomIntRange(1,2);
                newNodes[ox+':'+oy] = { depth: newNodeDepth, created: theTime, connected: [] };
                var lastAngle = Math.random() * 360;
                for(var i = 0; i < randomIntRange(0,2); i++) { // Use remaining power to make nodes
                    dist = randomRange(6 - i*2,6);
                    angle = lastAngle + 120 + Math.random() * 40;
                    lastAngle = angle;
                    ndx = Math.floor((dist * Math.cos(toRadians(angle-90))));
                    ndy = Math.floor((dist * Math.sin(toRadians(angle-90))));
                    newNodes[(ox+ndx)+':'+(oy+ndy)] = { depth: 1, created: theTime, 
                        connected: [ox+':'+oy] };
                    newNodes[ox+':'+oy].connected.push((ox+ndx)+':'+(oy+ndy));
                }
            // If a node is on or right next to the clicked spot
            } else if(nodes.hasOwnProperty(ox+':'+oy) || getBoxNeighbors(nodes,ox,oy,1)) {
                oCoords = nodes.hasOwnProperty(ox+':'+oy) ? ox+':'+oy : getBoxNeighbors(nodes,ox,oy,1)[0];
                ox = parseInt(oCoords.split(':')[0]); oy = parseInt(oCoords.split(':')[1]); // Update origin coords
                newNodes[ox+':'+oy] = nodes[ox+':'+oy];
                newNodes[ox+':'+oy].depth += 1;
                nodes[ox+':'+oy].connected = nodes[ox+':'+oy].connected ? nodes[ox+':'+oy].connected : [];
                for(var j = 0; j < nodes[ox+':'+oy].connected.length; j++) {
                    console.log('connected node:',j+1);
                    var thisNode = nodes[ox+':'+oy].connected[j];
                    // Chance to increase depth
                    if(Math.random() > 0.7) {
                        console.log('increasing depth');
                        nodes[thisNode].depth += 1;
                        newNodes[thisNode] = nodes[thisNode];
                    }
                    var lastNode = ox+':'+oy;
                    var branchLength = 1;
                    var branchDepths = nodes[thisNode].depth;
                    console.log('this node connects to',nodes[thisNode].connected.length,'other nodes');
                    // Traverse the path, stressing nodes along the way
                    while(nodes[thisNode].connected.length > 1) { // While the path continues
                        console.log('traversing path');
                        branchLength++;
                        branchDepths += nodes[thisNode].depth;
                        console.log('stress chance:', 1 - nodes[thisNode].depth/10);
                        if(Math.random() > nodes[lastNode].depth/10) {
                            console.log('stressing node along path');
                            nodes[thisNode].depth += 1;
                            newNodes[thisNode] = nodes[thisNode];
                        }
                        for(var k = 0; k < nodes[thisNode].connected.length; k++) {
                            if(nodes[thisNode].connected[k] != lastNode) { // Get next node in path
                                lastNode = thisNode;
                                thisNode = nodes[thisNode].connected[k];
                                console.log('found next node in path');
                                break;
                            }
                        }
                    }
                    newNodes[thisNode] = nodes[thisNode];
                    console.log('new node chance:',1-(branchDepths/branchLength) / 5);
                    // Now that we're at the last node, decide whether to extend the branch
                    if(Math.random() > (branchDepths/branchLength) / 5) {
                        console.log('creating new node at end of path');
                        dist = randomRange(4,6);
                        var thisX = thisNode.split(':')[0], thisY = thisNode.split(':')[1];
                        var lastDelta = [thisX - lastNode.split(':')[0], thisY - lastNode.split(':')[1]];
                        angle = toDegrees(Math.atan2(lastDelta[0],lastDelta[1]*-1));
                        console.log(lastDelta,'opposite angle:',angle);
                        angle = angle + Math.random() * 70 - 35;
                        console.log('new angle:',angle);
                        ndx = Math.floor((dist * Math.cos(toRadians(angle-90))));
                        ndy = Math.floor((dist * Math.sin(toRadians(angle-90))));
                        newNode = (parseInt(thisX) + ndx) + ':' + (parseInt(thisY) + ndy);
                        console.log(newNode);
                        newNodes[newNode] = {
                                depth: 1, created: theTime, connected: [thisNode]
                            };
                        newNodes[thisNode].connected = newNodes[thisNode].connected ? 
                            newNodes[thisNode].connected : [];
                        newNodes[thisNode].connected.push(newNode);
                    }
                }
                // Create nodes off clicked node based on how many already exist
                for(var l = 0; l < randomIntRange(1,3) - nodes[ox+':'+oy].connected.length; l++) {
                    console.log('creating new node',l+1,'off of clicked node');
                    var angles = [];
                    // Get angles of connected nodes
                    for(var m = 0; m < nodes[ox+':'+oy].connected.length; m++) {
                        var nearX = nodes[ox+':'+oy].connected[m].split(':')[0], 
                            nearY = nodes[ox+':'+oy].connected[m].split(':')[1];
                        var delta = [nearX - ox, nearY - oy];
                        angles.push(toDegrees(Math.atan2(delta[0],delta[1]*-1)));
                    }
                    var newAngle = angles.length == 0 ? Math.random()*360 : 0;
                    if(angles.length == 1) { 
                        newAngle = angles[0] + 180 + Math.random()*70 - 35; 
                    } else if(angles.length == 2) {
                        console.log('angles before fixing:',angles[0],angles[1]);
                        if(Math.abs(angles[0] - angles[1]) > 180) {
                            if(angles[0] < angles[1]) { angles[0] += 360; } else { angles[1] += 360; }
                        }
                        console.log('angles after fixing:',angles[0],angles[1]);
                        newAngle = (angles[0] + angles[1])/2 + 180 + Math.random()*70 - 35;
                    }
                    console.log('angle:',newAngle);
                    dist = randomRange(4,6);
                    ndx = Math.floor((dist * Math.cos(toRadians(newAngle-90))));
                    ndy = Math.floor((dist * Math.sin(toRadians(newAngle-90))));
                    console.log('creating new node at',(ox+ndx),(oy+ndy));
                    newNode = (ox + ndx) + ':' + (oy + ndy);
                    newNodes[newNode] = {
                        depth: 1, created: theTime, connected: [ox+':'+oy]
                    };
                    newNodes[ox+':'+oy].connected = newNodes[ox+':'+oy].connected ?
                        newNodes[ox+':'+oy].connected : [];
                    newNodes[ox+':'+oy].connected.push(newNode);
                }
                
            }
            
            
//                // Pick origin node
//                if(nodes.hasOwnProperty(ox+':'+oy)) { // Is there a node on the clicked spot?
//                    oCoords = ox+':'+oy;
//                    oNode.depth = nodes[oCoords].depth + 1;
//                    oNode.created = nodes[oCoords].created;
//                } else { // If not, check the surrounding area
//                    var boxNeighbors = getBoxNeighbors(nodes,ox,oy,1);
//                    if(boxNeighbors.length == 0) { // If no neighboring nodes are found
//                        oCoords = ox+':'+oy;
//                        oNode = { depth: 1, created:theTime }; // Create a new node at the clicked spot
//                    } else { // Neighbor(s) found
//                        oCoords = boxNeighbors[randomIntRange(0,boxNeighbors.length-1)]; // Pick random neighbor
//                        oNode.depth = nodes[oCoords].depth + 1;
//                        oNode.created = nodes[oCoords].created;
//                    }
//                }
//                nodes[oCoords] = oNode;
//                newNodes[oCoords] = oNode;
//                ox = parseInt(oCoords.split(':')[0]); oy = parseInt(oCoords.split(':')[1]);
//                
//                var nearNodes = getCircle(nodes,ox,oy,6);
//                console.log('found',nearNodes.length-1,'nodes nearby!');
//                for(var i = 0; i < nearNodes.length; i++) {
//                    if(nearNodes[i] == oCoords) { continue; }
//                    var nearCoords = nearNodes[i].split(':');
//                    var delta = [nearCoords[0] - ox, nearCoords[1] - oy];
//                    var distance = delta[0]*delta[0] + delta[1]*delta[1];
//                    var nearNode = nodes[nearNodes[i]];
//                    var depthDiff = nearNode.depth - oNode.depth;
//                    var newDelta = [];
//                    if(depthDiff > 0) { // Branching node clicked
//                        console.log('branching node clicked');
//                        newDelta = [delta[0]*-1 + randomIntRange(-2,2), delta[1]*-1 + randomIntRange(-2,2)];
//                    } else if(depthDiff < 0) { // Stemming node clicked
//                        console.log('stemming node clicked');
//                        newDelta = [delta[0]*2 + randomIntRange(-2,2), delta[1]*2 + randomIntRange(-2,2)];
//                    }
//                    if(depthDiff != 0) { // Only create a new node off of this near node if there is a diff
//                        newNodes[(ox+newDelta[0]) + ':' + (oy+newDelta[1])] = { depth: 1, created:theTime };
//                    }
//                }
            return newNodes;
        },
        generateNodes: function(seed,nodes) {
            var tap = [];
            Math.seedrandom(seed);
            var lastAngle = Math.random() * 360;
            for(var i = 0; i < 3; i++) {
                var dist = randomRange(9 - i*3,12);
                var angle = lastAngle + 90 + Math.random() * 40;
                lastAngle = angle;
                var dx = Math.round((dist * Math.cos(toRadians(angle)))/3);
                var dy = Math.round((dist * Math.sin(toRadians(angle)))/3);
                tap.push([dx,dy]);
            }
            return tap;
        },
        tutorial: function(step) {
            var text = '';
            switch(parseInt(step)) {
                case 0:
                    text = 'Tap on the ice for points.\n' +
                        'Be careful where you tap. Breaking off shards of ice will result in a severe penalty!';
                    break;
            }
            return text;
        }
    }
});