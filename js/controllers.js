/* Controllers */

angular.module('Icebreakr.controllers', [])
	.controller('Main', ['$scope', '$timeout', '$filter', 'localStorageService', 'colorUtility', 'canvasUtility', 'gameUtility', function($scope, $timeout, $filter, localStorageService, colorUtility, canvasUtility, gameUtility) {
        
        $scope.overPixel = ['-','-']; // Tracking your coordinates'
        $scope.authStatus = '';
        $scope.helpText = '';
        $scope.userTaps = 0;
        var mainPixSize = 3, keyPressed = false, keyUpped = true, mouseDown,
            pinging = false, userID, fireUser, localPixels = {}, localUsers = {}, tutorialStep = 0;
        
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
                                $scope.user = createdUser;
                                fireRef.auth(createdUser.token, function() {
                                    fireUser = fireRef.child('users/'+userID);
                                    fireUser.set({heartbeats: 0, new: 'true', 
                                        nick: createdUser.email.substr(0,createdUser.email.indexOf('@'))}, 
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
                    $scope.heartbeats = snapshot.val().heartbeats;
                    $scope.brain = snapshot.val().brain;
                    $scope.newUser = (snapshot.val()['new'] == 'true');
                    $scope.userInit = true;
                    if(!$scope.newUser) { return; }
                    tutorialStep = -1;
                    tutorial('next');
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
        canvasUtility.fillCanvas(mainContext,'222222');

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
        
        $scope.resetUser = function() {
            fireUser.set({heartbeats: 0, new: 'true', nick: 'Veggies'});
        };
        
        var onMouseDown = function(e) {
            e.preventDefault();
            // TODO: tap on the ice!
        };

        var onMouseUp = function(e) { panMouseDown = false; };
        
        // Check for mouse moving to new pixel
        var onMouseMove = function(e) {
            var offset = jQuery(mainHighCanvas).offset(); // Get pixel location
            var x = Math.floor((e.pageX - offset.left) / mainPixSize),
                y = Math.floor((e.pageY - offset.top) / mainPixSize);
            // If the pixel location has changed
            if($scope.overPixel[0] != x || $scope.overPixel[1] != y) {
                mainHighCanvas.style.cursor = 'default'; // Show cursor
                dimPixel(); // Dim the previous pixel
                $scope.$apply(function() {
                    $scope.overPixel = [x,y];
                    var drawColor = 'rgba(255, 255, 255, 0.1)';
                    canvasUtility.drawPixel(mainHighContext, drawColor, // Highlight pixel underneath cursor
                        $scope.overPixel, [1,1]);
                });
            }
        };
        // Dim the pixel after leaving it
        var dimPixel = function() {
            canvasUtility.fillCanvas(mainHighContext,'erase');
        };
        // When the mouse leaves the canvas
        var onMouseOut = function() {
            dimPixel();
            $scope.$apply(function() {
                $scope.overPixel = ['-','-'];
            });
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
        jQuery(window).resize(alignCanvases); // Re-align canvases on window resize
        
        // When a cell is added/changed
        var drawPixel = function(snapshot) {
            if(snapshot.val().owner == userID && !localPixels.hasOwnProperty(snapshot.name())) {
                $scope.userTaps++; }
            localPixels[snapshot.name()] = snapshot.val();
            localPixels[snapshot.name()].grid = snapshot.name(); // Add grid and owner nickname properties
            var coords = snapshot.name().split(":");
            canvasUtility.drawPixel(mainContext,snapshot.val().color.hex,coords,[1,1]);
        };
        // When a cell is removed
        var clearPixel = function(snapshot) {
            if(snapshot.val().owner == userID) { $scope.userTaps--; }
            delete localPixels[snapshot.name()];
            var coords = snapshot.name().split(":");
            $timeout(function(){ alignCanvases(); }, 200); // Realign canvases
            canvasUtility.drawPixel(mainContext,'222222',coords,[1,1]);
        };
        // Firebase listeners
        fireRef.child('taps').on('child_added', drawPixel);
        fireRef.child('taps').on('child_changed', drawPixel);
        fireRef.child('taps').on('child_removed', clearPixel);
        fireRef.child('users').on('child_added', function(snap) { localUsers[snap.name()] = snap.val(); });
        fireRef.child('users').on('child_changed', function(snap) { localUsers[snap.name()] = snap.val(); });
        fireRef.child('users').on('child_removed', function(snap) { delete localUsers[snap.name()]; });
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