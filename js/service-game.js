/* Game logic service */

angular.module('Icebreakr.game', [])
    .factory('gameUtility', function(colorUtility) {
        var randomIntRange = function(min,max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        var randomRange = function(min,max) {
            return Math.random() * max + min;
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
        return {
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