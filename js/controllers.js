/* Controllers */

angular.module('Icebreakr.controllers', [])
	.controller('Main', ['$scope', '$timeout', '$filter', 'localStorageService', 'colorUtility', 'canvasUtility', 'gameUtility', function($scope, $timeout, $filter, localStorageService, colorUtility, canvasUtility, gameUtility) {
        
        $scope.overPixel = ['-','-']; // Tracking your coordinates'
        $scope.authStatus = '';
        $scope.helpText = '';
        $scope.localUsers = {};
        $scope.eventLog = [];
        var mainPixSize = 3, keyPressed = false, keyUpped = true, mouseDown,
            pinging = false, userID, fireUser, localPixels = {}, tutorialStep = 0;
        
        // Authentication
        $scope.authenticate = function() {
            $scope.authStatus = 'logging';
            auth.login('password', {email: $scope.loginEmail, password: $scope.loginPassword, rememberMe: true});
        };
        $scope.logOut = function() { auth.logout(); };

        // Create a reference to the pixel data for our canvas
        var fireRef = new Firebase('https://icebreakr.firebaseio.com/map1');
        // Create a reference to the auth service for our data
        var auth = new FirebaseSimpleLogin(fireRef, function(error, user) {
            $timeout(function() {
                if(error) {
                    console.log(error, $scope.loginEmail, $scope.loginPassword);
                    if(error.code == 'INVALID_USER') {
                        auth.createUser($scope.loginEmail, $scope.loginPassword, 
                            function(createdError, createdUser) {
                            if(createdError) { console.log(createdError); } else {
                                console.log('user created:',createdUser.id,createdUser.email);
                                userID = createdUser.id;
                                $scope.user = {id: createdUser.id, email: createdUser.email, 
                                    taps: 0, score: 0, breaks: 0, 
                                    nick: createdUser.email.substr(0,createdUser.email.indexOf('@'))};
                                fireRef.auth(createdUser.token, function() {
                                    fireUser = fireRef.child('users/'+userID);
                                    fireUser.set($scope.user, 
                                        function() { initUser(); });
                                    $timeout(function() { $scope.authStatus = 'logged'; });
                                });
                            }
                        })
                    } else if(error.code == 'INVALID_PASSWORD') { $scope.authStatus = 'badPass'; } else 
                    if(error.code == 'INVALID_EMAIL') { $scope.authStatus = 'badEmail'; }
                } else if(user) {
                    console.log('logged in:',user.id,user.email);
                    $scope.user = user;
                    userID = user.id;
                    fireUser = fireRef.child('users/'+userID);
                    initUser();
                    $scope.authStatus = 'logged';
                } else { console.log('logged out'); $scope.authStatus = 'notLogged'; }
            });
        });
        
        var tutorial = function(action) {
            if(action == 'init') {
                if(localStorageService.get('tutorialStep')) {
                    tutorialStep = localStorageService.get('tutorialStep');
                } else { tutorialStep = 0; }
            } else { tutorialStep++; }
            $timeout(function() { 
                $scope.helpText = gameUtility.tutorial(tutorialStep);
                localStorageService.set('tutorialStep',tutorialStep);
            });
        };
        tutorial('init');
        
        var initUser = function() {
            fireUser.once('value', function(snapshot) {
                $timeout(function() { 
                    $scope.user = snapshot.val();
                    $scope.userInit = true;
                });
            });
        };
        
        // Attempt to get these variables from localstorage
        var localStores = ['zoomPosition','zoomLevel'];
        for(var i = 0; i < localStores.length; i++) {
            if(localStorageService.get(localStores[i])) {
                $scope[localStores[i]] = localStorageService.get(localStores[i]);
            }
        }
        
        // Set up our canvas
        var mainCanvas = document.getElementById('mainCanvas');
        var mainContext = mainCanvas.getContext ? mainCanvas.getContext('2d') : null;
        canvasUtility.fillCanvas(mainContext,'1f2022');

        // Prevent right-click on canvas
        jQuery('body').on('contextmenu', '#mainHighlightCanvas', function(e){ return false; });

        var mainPingCanvas = document.getElementById('mainPingCanvas'); // Main canvas pinging
        var mainHighCanvas = document.getElementById('mainHighlightCanvas'); // Main canvas highlighting
        var mainPingContext = mainPingCanvas.getContext ? mainPingCanvas.getContext('2d') : null;
        var mainHighContext = mainHighCanvas.getContext ? mainHighCanvas.getContext('2d') : null;
        $timeout(function(){ alignCanvases(); }, 500); // Set its position to match the real canvas

        // Align canvas positions
        var alignCanvases = function() {
            jQuery(mainPingCanvas).offset(jQuery(mainCanvas).offset());
            jQuery(mainHighCanvas).offset(jQuery(mainCanvas).offset());
        };
        
        // Keep track of if the mouse is up or down
        mainHighCanvas.onmousedown = function(event) { 
            mouseDown = 1; 
            if(event.which == 2) {
                
            }
            return false; 
        };
        mainHighCanvas.onmouseout = mainHighCanvas.onmouseup = function(event) {
            if(event.which == 2) {
                
            }
            mouseDown = 0; 
        };

        // Disable text selection.
        mainHighCanvas.onselectstart = function() { return false; };
        
        // Reset all taps and scores
        $scope.reset = function() {
            fireRef.once('value',function(snap) {
                var cleaned = snap.val();
                delete cleaned.taps;
                for(var key in cleaned.users) {
                    if(cleaned.users.hasOwnProperty(key)) {
                        var cleanUser = cleaned.users[key];
                        cleanUser.breaks = cleanUser.score = cleanUser.taps = 0;
                    }
                }
                fireRef.set(cleaned);
            });
        };
        
        var onMouseDown = function(e) {
            e.preventDefault();
            // TODO: tap on the ice!
            var offset = jQuery(mainHighCanvas).offset(); // Get pixel location
            var x = Math.floor((e.pageX - offset.left) / mainPixSize),
                y = Math.floor((e.pageY - offset.top) / mainPixSize);
            fireUser.child('taps').once('value', function(snap) { 
                $scope.$apply(function() {
                    $scope.user.taps = snap.val() + 1;
                    $scope.user.score = $scope.user.taps - $scope.user.breaks * 30;
                    fireUser.set(angular.copy($scope.user));
                });
            });
            var tapped = {};
            var theTime = new Date().getTime();
            fireRef.child('taps/'+x+':'+y).once('value', function(snap) {
                if(snap.val()) { // Is there already a tap there?
                    tapped = snap.val();
                    tapped.tapCount++;
                    tapped.lastTap = theTime;
                    tapped.lastUser = $scope.user.id;
                } else { // Fresh tap
                    tapped = { tapCount: 1, firstTap: theTime, lastTap: theTime, 
                        seed: Math.round(Math.random() * 100000),
                        firstUser: $scope.user.id, lastUser: $scope.user.id };
                }
                fireRef.child('taps/'+x+':'+y).set(angular.copy(tapped));
            })
        };

        var onMouseUp = function(e) { mouseDown = false; };
        
        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            var offset = jQuery(mainHighCanvas).offset(); // Get pixel location
            var x = Math.floor((e.pageX - offset.left) / mainPixSize),
                y = Math.floor((e.pageY - offset.top) / mainPixSize);
            // If the pixel location has changed
            if($scope.overPixel[0] != x || $scope.overPixel[1] != y) {
                mainHighCanvas.style.cursor = 'default'; // Show cursor
                dimPixel(); // Dim the previous pixel
                var drawColor = 'rgba(255, 255, 255, 0.1)';
                canvasUtility.drawPixel(mainHighContext, drawColor, // Highlight pixel underneath cursor
                    $scope.overPixel, [1,1]);
                $scope.$apply(function() { $scope.overPixel = [x,y]; });
            }
        };
        // Dim the pixel after leaving it
        var dimPixel = function() {
            canvasUtility.fillCanvas(mainHighContext,'erase');
        };
        // When the mouse leaves the canvas
        var onMouseOut = function() {
            dimPixel();
            $scope.$apply(function() { $scope.overPixel = ['-','-']; });
        };
        // Ping a pixel
        var ping = function() {
            if(pinging || $scope.overPixel[0] == '-') { return; }
            pinging = $scope.overPixel;
            fireRef.child('meta/pings/'+pinging[0] + ":" + pinging[1]).set(true);
            $timeout(function(){unPing()},1600); // Keep ping for 5 seconds
        };
        // Un-ping a pixel
        var unPing = function() {
            fireRef.child('meta/pings/'+pinging[0] + ":" + pinging[1]).set(null);
            pinging = false;
        };
        var drawPing = function(snapshot) { canvasUtility.drawPing(mainPingContext,snapshot.name().split(":")); };
        var hidePing = function(snapshot) { canvasUtility.clearPing(mainPingContext,snapshot.name().split(":")); };
        
        jQuery(mainHighCanvas).mousemove(onMouseMove);
        jQuery(mainHighCanvas).mouseleave(onMouseOut);
        jQuery(mainHighCanvas).mousedown(onMouseDown);
        jQuery(mainHighCanvas).mouseup(onMouseUp);
        jQuery(window).resize(alignCanvases); // Re-align canvases on window resize
        
        // When a tap is added/changed
        var drawTap = function(snap) {
            localPixels[snap.name()] = snap.val();
            localPixels[snap.name()].grid = snap.name(); // Add grid and owner nickname properties
            var coords = snap.name().split(":");
        //    canvasUtility.drawPixel(mainContext,snapshot.val().color.hex,coords,[1,1]);
            if(!$scope.localUsers.hasOwnProperty('4')) { return; } // If users haven't been fetched yet
            $scope.eventLog.unshift({ user: $scope.localUsers[snap.val().lastUser].nick, action: 'tapped',
                coords: coords[0] + ' , ' + coords[1], time: snap.val().lastTap });
            if($scope.eventLog.length > 10) {
                $scope.eventLog.pop();
            }
        };
        // When the board is reset
        var clearCanvas = function(snapshot) {
            $scope.eventLog = [];
            $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
            canvasUtility.fillCanvas(mainContext,'1f2022'); // Clear canvas
        };
        
        var updateUsers = function(snap) {
            $timeout(function() { 
                $scope.localUsers[snap.name()] = snap.val(); 
                if(!$scope.user) { return; }
                $scope.user = $scope.localUsers[$scope.user.id] 
            });
        };
        
        // Firebase listeners
        fireRef.child('taps').on('child_added', drawTap);
        fireRef.child('taps').on('child_changed', drawTap);
        fireRef.child('taps').on('child_removed', clearCanvas);
        fireRef.child('users').on('child_added', updateUsers);
        fireRef.child('users').on('child_changed', updateUsers);
        fireRef.child('meta/pings').on('child_added', drawPing);
        fireRef.child('meta/pings').on('child_removed', hidePing);
        
        var onKeyDown = function(e) {
            if(!keyUpped) { return; }
            keyUpped = false;
            switch (e.which) {
                case 65: // A
                    ping();
                    break;
            }
        };

        jQuery(window).keydown(onKeyDown);
        jQuery(window).keyup(function() { keyUpped = true; });
    }])
    ;