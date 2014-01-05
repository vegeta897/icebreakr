/* Canvas drawing service */

angular.module('Icebreakr.canvas', [])
    .factory('canvasUtility', function(colorUtility) {
        var pixSize = 5;
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
            drawNode: function(context,lowContext,x,y,nodes) {
                
                // TODO: Come up with a way to prevent intersecting lines being drawn
                
                var ox = x*pixSize+pixOff, oy = y*pixSize+pixOff;
                var nearNodes = getCircle(nodes,x,y,12);
                for(var i = 0; i < nearNodes.length; i++) {
                    var nx = nearNodes[i].split(':')[0]*pixSize + pixOff, 
                        ny = nearNodes[i].split(':')[1]*pixSize + pixOff;
                    var flip = false;
                    context.lineCap = 'round'; lowContext.lineCap = 'round';
                    // Always draw lines from left-to-right, top-to-bottom
                    var x1 = ox, x2 = nx, y1 = oy, y2 = ny;
                    if((nx < ox) || (nx == ox && ny < oy)) { flip = true; x1 = nx; x2 = ox; y1 = ny; y2 = oy; }
                    var dx = x2 - x1, dy = y2 - y1; // Get deltas
                    var coord1 = flip ? nearNodes[i] : x+':'+y, coord2 = flip ? x+':'+y : nearNodes[i];
                    var node1 = nodes[coord1], node2 = nodes[coord2];
                    var opacity1 = node1.depth/10, opacity2 = node2.depth/10;
                    var r1 = 38 + Math.floor(104*opacity1), rd = 38 + Math.floor(104*opacity2) - r1,
                        g1 = 39 + Math.floor(103*opacity1), gd = 39 + Math.floor(103*opacity2) - g1,
                        b1 = 41 + Math.floor(101*opacity1), bd = 41 + Math.floor(101*opacity2) - b1;
                    var width1 = 1 + node1.depth/30, widthD = (1 + node2.depth/30) - width1;
                    var alpha1 = node1.depth/10, alphaD = (node2.depth/10) - alpha1;
                    var subnodes = 2 + Math.floor((dx*dx + dy*dy)/700); // Subnode count based on distance
                    var variance = subnodes/3; // Variance based on subnode count
                    for(var k = 3; k >= 0; k--) { // Erase shade, draw shade, erase crack, draw crack
                        var drawContext = k < 2 ? context : lowContext;
                        var offset = k < 2 ? 0 : -1;
                        var lastCoord = [x1+offset, y1+offset], lastWidth = 0;
                        Math.seedrandom(x1*y1*x2*y2); // Generate same crack variations
                        for(var j = 0; j < subnodes; j++) {
                            drawContext.beginPath();
                            drawContext.moveTo(lastCoord[0], lastCoord[1]);
                            lastCoord = [
                                offset + x1 + (dx*(j+1))/(subnodes+1) + Math.random()*variance-variance/2,
                                offset + y1 + (dy*(j+1))/(subnodes+1) + Math.random()*variance-variance/2];
                            drawContext.lineTo(lastCoord[0],lastCoord[1]);
                            lastWidth = width1+widthD*j/subnodes;
                            drawContext.lineWidth = lastWidth;
                            drawContext.strokeStyle = 'rgba(31, 32, 34, 1)';
                            switch(k) {
                                case 2: drawContext.strokeStyle = 
                                        'rgba(0, 0, 0, ' + (alpha1+alphaD*j/subnodes) + ')'; break;
                                case 0: drawContext.strokeStyle = 'rgba(' +
                                        Math.floor((r1+rd*j/(subnodes-1))) + ', ' +
                                        Math.floor((g1+gd*j/(subnodes-1))) + ', ' +
                                        Math.floor((b1+bd*j/(subnodes-1))) + ', 1)'; 
                                    break;
                            }
                            drawContext.stroke();
                        }
                        drawContext.beginPath();
                        drawContext.moveTo(lastCoord[0], lastCoord[1]);
                        drawContext.lineTo(x2+offset, y2+offset);
                        drawContext.lineWidth = width1 + widthD;
                        drawContext.strokeStyle = 'rgba(31, 32, 34, 1)';
                        switch(k) {
                            case 2: drawContext.strokeStyle = 'rgba(0, 0, 0, ' + (alpha1 + alphaD) + ')'; break;
                            case 0: drawContext.strokeStyle = 
                                    'rgba(' + (r1+rd) + ', ' + (g1+gd) + ', ' + (b1+bd) + ', 1)'; 
                                break;
                        }
                        drawContext.stroke();
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