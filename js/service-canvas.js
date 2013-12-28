/* Canvas drawing service */

angular.module('Icebreakr.canvas', [])
    .factory('canvasUtility', function(colorUtility) {
        var mainPixSize = 3;
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
        return {
            fillCanvas: function(context,color) {
                var method = color == 'erase' ? 'clearRect' : 'fillRect';
                if(color != 'erase') { context.fillStyle = color.charAt(0) == 'r' ? color : '#' + color; }
                context[method](0,0,1200,750);
            },
            drawNode: function(context,x,y,nodes,intensity) {

                var ox = x*mainPixSize+1.5, oy = y*mainPixSize+1.5;
                var nearNodes = getCircle(nodes,x,y,12);
                var opacity = intensity / 20;
                for(var i = 0; i < nearNodes.length; i++) {
                    if(nearNodes[i] == x+':'+y) { continue; }
                    var nx = nearNodes[i].split(':')[0]*mainPixSize + 1.5, 
                        ny = nearNodes[i].split(':')[1]*mainPixSize + 1.5;
                    // Draw shading
                    context.beginPath();
                    context.moveTo(ox+1, oy+1);
                    context.lineTo(nx+1, ny+1);
                    context.strokeStyle = 'rgba(0, 0, 0, '+(opacity*1.5)+')';
                    context.stroke();
                    // Draw white line
                    context.beginPath();
                    context.moveTo(ox, oy);
                    context.lineTo(nx, ny);
                    context.strokeStyle = 'rgba(255, 255, 255, '+opacity+')';
                    context.stroke();
                }
            },
            drawPixel: function(context,color,coords,size) {
                var method = color == 'erase' ? 'clearRect' : 'fillRect';
                var x = parseInt(coords[0]), y = parseInt(coords[1]);
                if(color != 'erase') { context.fillStyle = color.charAt(0) == 'r' ? color : '#' + color; }
                context[method](x*mainPixSize,y*mainPixSize,size[0]*mainPixSize,size[1]*mainPixSize);
            },
            drawPing: function(context,coords) {
                var pingGradient = context.createRadialGradient(
                    coords[0]*mainPixSize + mainPixSize/2, coords[1]*mainPixSize + mainPixSize/2, 5,
                    coords[0]*mainPixSize + mainPixSize/2, coords[1]*mainPixSize + mainPixSize/2, 0
                );
                pingGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                pingGradient.addColorStop(0.2, "rgba(255, 255, 255, 1)");
                pingGradient.addColorStop(0.4, "rgba(255, 255, 255, 0)");
                pingGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                context.fillStyle = pingGradient;
                context.beginPath();
                context.arc(coords[0]*mainPixSize + mainPixSize/2,
                    coords[1]*mainPixSize + mainPixSize/2, 5, 0, 2 * Math.PI, false);
                var cycle = 0;
                function fadePing() {
                    if(Math.round(cycle/2) == cycle/2) {
                        context.fill();
                    } else {
                        context.clearRect(coords[0] * mainPixSize - 15 + mainPixSize/2,
                            coords[1] * mainPixSize - 15 + mainPixSize/2, 30, 30);
                    }
                    cycle++;
                    if(cycle >= 8) {
                        clearInterval(pingInt);
                    }
                }
                var pingInt = setInterval(function(){fadePing()},200);
            },
            clearPing: function(context,coords) {
                context.clearRect(coords[0] * mainPixSize - 15 + mainPixSize/2,
                    coords[1] * mainPixSize - 15 + mainPixSize/2, 30, 30);
            }
        }
});