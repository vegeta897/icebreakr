/* Canvas drawing service */

angular.module('Icebreakr.canvas', [])
    .factory('canvasUtility', function(colorUtility) {
        var mainPixSize = 3;
        return {
            fillCanvas: function(context,color) {
                var method = color == 'erase' ? 'clearRect' : 'fillRect';
                if(color != 'erase') { context.fillStyle = color.charAt(0) == 'r' ? color : '#' + color; }
                context[method](0,0,1200,750);
            },
            drawTap: function(context,coords,tap) {
                context.beginPath();
                var ox = coords[0]*mainPixSize, oy = coords[1]*mainPixSize;
                for(var i = 0; i < tap.length; i++) {
                    context.moveTo(ox + 0.5, oy + 0.5);
                    context.lineTo(ox + tap[i][0], oy + tap[i][1]);
                }
                context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                context.stroke();
            },
            drawPixel: function(context,color,coords,size) {
                var method = color == 'erase' ? 'clearRect' : 'fillRect';
                if(color != 'erase') { context.fillStyle = color.charAt(0) == 'r' ? color : '#' + color; }
                context[method](coords[0]*mainPixSize,coords[1]*mainPixSize,size[0]*mainPixSize,size[1]*mainPixSize);
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