/* Canvas drawing service */

angular.module('Icebreakr.canvas', [])
    .factory('canvasUtility', function(colorUtility) {
        var pixSize = 3;
        var pixOff = pixSize/2;
        var getCircle = function(nodes,x,y,dist) { // Check circular area around x,y
            var neighbors = [];
            x = parseInt(x); y = parseInt(y);
            for(var i = dist*-1; i <= dist; i++) {
                for(var ii = dist*-1; ii <= dist; ii++) {
                    var nx = (x+i), ny = (y+ii);
                    // TODO: Need a way to consistently ignore nodes connected to too many times
                    if(dist*dist > i*i + ii*ii && nodes.hasOwnProperty(nx+':'+ny)) {
                        neighbors.push(nx+':'+ny);
                    }
                }
            }
            return neighbors;
        };
        return {
            
            // TODO: Draw light scratches on the whole canvas when the app loads
            
            fillCanvas: function(context,color) {
                var method = color == 'erase' ? 'clearRect' : 'fillRect';
                if(color != 'erase') { context.fillStyle = color.charAt(0) == 'r' ? color : '#' + color; }
                context[method](0,0,1200,750);
            },
            drawNode: function(context,x,y,nodes,intensity) {
                
                // TODO: Come up with a way to prevent intersecting lines being drawn
                
                var ox = x*pixSize+pixOff, oy = y*pixSize+pixOff;
                var nearNodes = getCircle(nodes,x,y,12);
                var opacity = intensity / 20;
                for(var i = 0; i < nearNodes.length; i++) {
                    if(nearNodes[i] == x+':'+y) { continue; }
                    var nx = nearNodes[i].split(':')[0]*pixSize + pixOff, 
                        ny = nearNodes[i].split(':')[1]*pixSize + pixOff;
                    
                    // TODO: Don't modify opacity, use RGB
                    // Remember to remove the intensity adjustment in the controller

                    // Always draw lines from left-to-right, top-to-bottom
                    var x1 = ox, x2 = nx, y1 = oy, y2 = ny;
                    if((nx < ox) || (nx == ox && ny < oy)) { x1 = nx; x2 = ox; y1 = ny; y2 = oy; }
                    var dx = x2 - x1, dy = y2 - y1; // Get deltas
                    var subnodes = Math.floor((dx*dx + dy*dy)/400); // Subnode count based on distance
                    for(var k = 1; k > -1; k--) { // Draws shading, then actual crack
                        Math.seedrandom(x1*y1*x2*y2); // Generate same crack variations
                        context.beginPath();
                        context.moveTo(x1+k, y1+k);
                        for(var j = 0; j < subnodes; j++) {
                            context.lineTo(
                                k + x1 + (dx*(j+1))/(subnodes+1) + Math.random()*pixSize-pixSize/2,
                                k + y1 + (dy*(j+1))/(subnodes+1) + Math.random()*pixSize-pixSize/2)
                        }
                        context.lineTo(x2+k, y2+k);
                        context.strokeStyle = 'rgba('+255*(1-k)+', '+255*(1-k)+', '+255*(1-k)+', ' + 
                            (opacity + opacity*0.5*k) + ')';
                        context.stroke();
                    }
                }
            },
            drawPixel: function(context,color,coords,size) {
                var method = color == 'erase' ? 'clearRect' : 'fillRect';
                var x = parseInt(coords[0]), y = parseInt(coords[1]);
                if(color != 'erase') { context.fillStyle = color.charAt(0) == 'r' ? color : '#' + color; }
                context[method](x*pixSize,y*pixSize,size[0]*pixSize,size[1]*pixSize);
            },
            drawPing: function(context,coords) {
                var pingGradient = context.createRadialGradient(
                    coords[0]*pixSize + pixSize/2, coords[1]*pixSize + pixSize/2, 5,
                    coords[0]*pixSize + pixSize/2, coords[1]*pixSize + pixSize/2, 0
                );
                pingGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                pingGradient.addColorStop(0.2, "rgba(255, 255, 255, 1)");
                pingGradient.addColorStop(0.4, "rgba(255, 255, 255, 0)");
                pingGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                context.fillStyle = pingGradient;
                context.beginPath();
                context.arc(coords[0]*pixSize + pixSize/2,
                    coords[1]*pixSize + pixSize/2, 5, 0, 2 * Math.PI, false);
                var cycle = 0;
                function fadePing() {
                    if(Math.round(cycle/2) == cycle/2) {
                        context.fill();
                    } else {
                        context.clearRect(coords[0] * pixSize - 15 + pixSize/2,
                            coords[1] * pixSize - 15 + pixSize/2, 30, 30);
                    }
                    cycle++;
                    if(cycle >= 8) {
                        clearInterval(pingInt);
                    }
                }
                var pingInt = setInterval(function(){fadePing()},200);
            },
            clearPing: function(context,coords) {
                context.clearRect(coords[0] * pixSize - 15 + pixSize/2,
                    coords[1] * pixSize - 15 + pixSize/2, 30, 30);
            }
        }
});