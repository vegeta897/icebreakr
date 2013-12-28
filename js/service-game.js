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
            tapNodes: function(nodes,ox,oy) { // ox and oy are the clicked coords
                var theTime = new Date().getTime();
                var oCoords = '';
                if(!nodes) { nodes = {}; } // If there are no nodes, create a blank nodes object
                // Pick origin node
                if(nodes.hasOwnProperty(ox+':'+oy)) { // Is there a node on the clicked spot?
                    oCoords = ox+':'+oy;
                } else { // If not, check the surrounding area
                    var boxNeighbors = getBoxNeighbors(nodes,ox,oy,1);
                    if(boxNeighbors.length == 0) { // If no neighboring nodes are found
                        oCoords = ox+':'+oy;
                        nodes[oCoords] = { depth: 0, created:theTime }; // Create a new node at the clicked spot
                    } else { // Neighbor(s) found
                        oCoords = boxNeighbors[randomIntRange(0,boxNeighbors.length-1)]; // Pick random neighbor
                    }
                }
                var oNode = nodes[oCoords]; // Origin node
                ox = parseInt(oCoords.split(':')[0]); oy = parseInt(oCoords.split(':')[1]);
                var nearNodes = getCircle(nodes,ox,oy,6);
                console.log('found',nearNodes.length-1,'nodes nearby!');
                var maxNew = 0, minNew = 0;
                if(nearNodes.length-1 >= 3) { // If there are at least 3 nearby nodes
                    // Don't create any new ones
                } else if(nearNodes.length-1 >= 1) { // 1 nearby
                    maxNew = 1;
                } else { // None nearby
                    minNew = 1;
                    maxNew = 2;
                }
                var newCount = randomIntRange(minNew,maxNew);
                console.log('creating', newCount, 'new nodes');
                if(newCount > 0) { // If we're creating new nodes
                    if(nearNodes.length > 1) {
                        var nearAngles = [];
                        for(var j = 0; j < nearNodes.length; j++) {
                            if(nearNodes[j] == oCoords) { continue; }
                            var delta = [nearNodes[j].split(':')[0] - ox, oy - parseInt(nearNodes[j].split(':')[1])];
                            nearAngles.push(toDegrees(Math.atan2(delta[0],delta[1])));
                        }
                        var newAngles = [];
                        if(nearAngles.length == 2) {
                            if(nearAngles[0] - nearAngles[1] > 180) { // If we need to wrap
                                nearAngles[1] += 360;
                            } else if(nearAngles[1] - nearAngles[0] > 180) {
                                nearAngles[0] += 360;
                            }
                            var spread = Math.abs(nearAngles[0]-nearAngles[1]);
                            if(spread > 160) { // Are the angles nearly opposite?
                                newAngles.push(nearAngles[randomIntRange(0,1)] + randomRange(50,130));
                            } else { // Go to the opposite of the average of the 2 angles
                                newAngles.push(((nearAngles[0] + nearAngles[1]) / 2 + randomRange(150,210)) % 360);
                            }
                        } else if(nearAngles.length == 1) {
                            newAngles.push(nearAngles[0] + 180 + randomRange(-90,90) / Math.ceil(Math.random()*5));
                        }
                        for(var k = 0; k < newCount; k++) { // Create new nodes nearby
                            var dist = randomRange(6,8);
                            var dx = Math.round((dist * Math.cos(toRadians(newAngles[k]-90))));
                            var dy = Math.round((dist * Math.sin(toRadians(newAngles[k]-90))));
                            nodes[(ox+dx)+':'+(oy+dy)] = { depth: 1, created:theTime };
                        }
                    } else { // No nearby nodes
                        var lastAngle = Math.random() * 360;
                        for(var l = 0; l < newCount; l++) { // Create new nodes nearby
                            var ndist = randomRange(8 - l*2,8);
                            var angle = lastAngle + 90 + Math.random() * 40;
                            lastAngle = angle;
                            var ndx = Math.round((ndist * Math.cos(toRadians(angle-90))));
                            var ndy = Math.round((ndist * Math.sin(toRadians(angle-90))));
                            nodes[(ox+ndx)+':'+(oy+ndy)] = { depth: 1, created:theTime };
                        }
                    }
                    
                }
                for(var i = 0; i < nearNodes.length; i++) { // Stress all nodes in area
                    nodes[nearNodes[i]].depth++;
                    if(nearNodes[i] == oCoords) { nodes[nearNodes[i]].depth++; } // Stress clicked node again
                }
                return nodes;
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