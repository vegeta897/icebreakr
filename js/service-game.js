/* Game logic service */

angular.module('Icebreakr.game', [])
    .factory('gameUtility', function(colorUtility) {
        var randomIntRange = function(min,max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        var randomRange = function(min,max) {
            return Math.random() * max + min;
        };
        var toRadians = function(angle) {
            return angle * (Math.PI / 180);
        };
        var getNeighbors = function(loc,dist) {
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
        var getDigit = function(num, digit) {
            return Math.floor(num / (Math.pow(10, digit-1)) % 10)
        };
        return {
            generateTap: function(seed,intensity) {
                var tap = [];
                Math.seedrandom(seed);
                var lastAngle = Math.random() * 360;
                for(var i = 0; i < 3; i++) {
                    var dist = randomRange(6,11);
                    var angle = lastAngle + 90 + Math.random() * 90;
                    lastAngle = angle;
                    var dx = Math.floor(dist * Math.cos(toRadians(angle)));
                    var dy = Math.floor(dist * Math.sin(toRadians(angle)));
                    tap.push([dx,dy]);
                }
                return tap;
            },
            tutorial: function(step) {
                var text = '';
                switch(parseInt(step)) {
                    case 0:
                        text = 'Tap on the ice for points.\n' +
                            'Be careful where you tap. Breaking the ice will result in a severe penalty!';
                        break;
                }
                return text;
            }
        }
});