var SlotBotRanking = function() {

    // Ranking
    var ranking = {
        bot: { laps: [2.1] },
        sym: { laps: [4.2] },
        usr: { laps: [12.2] },
    };

    var laptimesList = document.getElementById('laptimesList');

    this.didLap = function(who, lapTime) {

        if ( ranking[who] === undefined ) {
            ranking[who] = {
                laps: [],
            };
        }

        ranking[who].laps.push(lapTime);

        updateRankingTable();
    };

    function reset() {
        //ranking = {};     
        updateRankingTable();
    }

    function sumLaps(player) {
        var s = 0;
        for(var i in player.laps) s += player.laps[i];
        return s;
    }


    function sortRanking() {
        var sortedPlayers = Object.keys(ranking);
        sortedPlayers.sort(function(a,b) { return  (Math.min.apply(null, ranking[a].laps) - Math.min.apply(null, ranking[b].laps)); } );
        return sortedPlayers;
    }

    updateRankingTable();

    function updateRankingTable() {
        var sortedPlayers = sortRanking();

        var output = '';
        for (var rankingKey in sortedPlayers) {
            var playerKey = sortedPlayers[rankingKey];
            var rankingRow = ranking[ playerKey ];
            var bestLapTime = Math.min.apply(null, rankingRow.laps);
            bestLapTime = (Number.isFinite(bestLapTime) && bestLapTime > 0) ? formatTime(bestLapTime) : 0;
            var lastLapTime = rankingRow.laps[ rankingRow.laps.length - 1];
            lastLapTime = (lastLapTime !== undefined && lastLapTime > 0) ? formatTime(lastLapTime) : 0;
            var lapCount = rankingRow.laps.length;
            output += '<tr><td>' + (parseInt(rankingKey)+1) + 'º</td><td>'+playerKey+'</td><td>'+lapCount+'</td><td>'+lastLapTime+'</td><td>'+bestLapTime+'</td></tr>';
        }
        laptimesList.innerHTML = output;
    }

    return this;

}();


var SlotBot = function() {

    var _ = this;

    var throttleEl = null; // Dom element
    var throttle = 0;
    var positionPercentage = 0;
    var lapCount = 0; // Stores the lap count

    this.progressOffset = 0.7;

    var clockTimeStep = ( 1000 / 25 ); // 24 fps
    //var clockTimeStep = 50; // test
    var clockInterval;
    var timestamp = 0;
    var prevTimestamp = 0;
    var stopwatchActive = false;

    this.isThrottlePressed = false;

    // Debug fields - Dom elements
    var debugTimestamp;
    var debugThrottle;
    var debugPosition;
    var currentTimestampEl;

    // Bind clock cycle
    function initClockCycle() {
        clockInterval = setInterval(clockCycle, clockTimeStep);
    }

    // Clock cycle loop
    function clockCycle() {

        var throttlePercentage = 0;
        //if (stopwatchActive === true)
            throttlePercentage = getThrottlePercentage();

        var positionPercentage = getPositionPercentage();

        // update timestamp
        var deltaTimestamp = timestamp - prevTimestamp;
        prevTimestamp = timestamp;

        // Calculate position
        var newInfo = getTrackPosition(deltaTimestamp, throttlePercentage, positionPercentage, 1);
        var newPosition = newInfo.position;

        countLapsAndResetTimer(newPosition);

        setPositionPercentage(newPosition); // Returns valid number after seting

        // Run timestamp
        if ( stopwatchActive ) {
            timestamp += (clockTimeStep / 1000);
        } else {
            _.startTimer();
        }

        _.didUpdatePosition(newPosition);

        regulateThrottle();

        // Show debug information
        updateDebugInformation();
    }

    function countLapsAndResetTimer(pos) {
        if ( pos >= 1.0 ) {
            ++lapCount;
            SlotBotRanking.didLap('sym', timestamp);
            _.resetTimer();
        }
        //console.log('Current time', timestamp, 'positionPercentage', positionPercentage);
    }

    // Fake remote
    var remoteValue = 0;
    function regulateThrottle() {
        // Acelerate
        if ( _.isThrottlePressed ) {
            remoteValue = Math.min( remoteValue + ((remoteValue + 1) * 3), 100);
        }
        // Decelerate
        else {
            remoteValue = Math.max( 0, remoteValue - ((remoteValue + 2) * 0.5));
        }
        setThrottlePercentage(remoteValue / 100);
    }

    function getThrottlePercentage() {
        return parseInt(throttleEl.value) / 100.0;
    }

    function setThrottlePercentage(val) {
        throttleEl.value = val * 100.0;
    }

    function getPositionPercentage() {
        return positionPercentage;
    }

    function setPositionPercentage(val) {
        positionPercentage = val % 1.0;
        //console.log('positionPercentage', positionPercentage);
        return positionPercentage;
    }

    function updateDebugInformation() {
        debugTimestamp.innerHtml = timestamp;
        var throttle = getThrottlePercentage();
        debugThrottle.value = (isNaN(throttle)) ? 0 : throttle * 100;
        var position = getPositionPercentage();
        debugPosition.value = (isNaN(position)) ? 0 : position * 100;
        currentTimestampEl.innerHTML = formatTime(timestamp);
    }

    // Listen for resistance changes
    this.init = function() {
        initClockCycle();
    };

    this.startTimer = function() {
        //SlotBotRanking.reset();
        stopwatchActive = true;
    };
    this.stopTimer = function() {
        stopwatchActive = false;
    };
    this.resetTimer = function() {
        timestamp = 0;
        prevTimestamp = 0;
    };

    this.bindThrottleEl = function(el) {
        throttleEl = el;
    };

    this.bindDebugFields = function(obj) {
        debugTimestamp = obj.debugTimestamp;
        debugThrottle = obj.debugThrottle;
        debugPosition = obj.debugPosition;
        currentTimestampEl = obj.currentTimestamp;
    };

    this.move = function(val) {
        positionPercentage += val;
    };

    return this;
}();

SlotBot.init();
SlotBot.bindThrottleEl(document.getElementById('throttle'));
SlotBot.bindDebugFields({
    debugTimestamp: document.getElementById('timestampValue'),
    debugThrottle: document.getElementById('throttleValue'),
    debugPosition: document.getElementById('positionValue'),
    currentTimestamp: document.getElementById('currentTimestamp')
});

// Set duration for easy positioning
var durationQuantity = 100; // means 100 seconds which we will interpret as 100 percent

// Get track 1 path
var path = MorphSVGPlugin.pathDataToBezier("#track1");

//path[0].rotate = '10deg';

var initialPosition = {
    x: path[0].x,
    y: [path[0].y]
};

//Define timeline for track 1
var timeline = new TimelineMax({
    repeat: -1,
});

// Create track 1 tween
var car1 = document.getElementById('cart');
var tween = new TweenMax('#car1', durationQuantity, {
    bezier:{
        values: path,
        type: 'cubic'
    },
    transformOrigin: '-50% -50%',
    ease: Linear.easeNone
});

// Add track 1 to track 1 timeline
timeline.add(tween);
// Pause, will animate
timeline.pause();
// Set correct start position
timeline.progress(SlotBot.progressOffset);
var oldCarPosition = getCarPosition();

timeline.eventCallback('onUpdate', function(self) {
    var children = self.getChildren();
    //console.log('onUpdate', tween, children);
}, ["{self}"]);


var positionDirection = 1; // 1 = forward,  -1 = backward

function getCarPosition() {
    var values = document.getElementById("car1").style.transform.replace(/[^0-9\-.,]/g, '').split(',');
    if (values.length == 6)
        return { 'x': parseInt(values[values.length-2]), 'y': parseInt(values[values.length-1]) };
    else
        return { 'x': parseInt(values[values.length-4]), 'y': parseInt(values[values.length-3]) };
}

function updateRotationForPosition(positionPercentage) {
    var newCarPosition = getCarPosition();

    var x = newCarPosition['x'] - oldCarPosition['x'];
    var y = newCarPosition['y'] - oldCarPosition['y'];
    var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    //console.log("deltaX: " + x + " deltaY: " + y + " | mexeu: " + dist);

    if (dist > 1) {
        var angle = Math.atan2(y, x) * 180.0 / Math.PI + 180;

        if (!isNaN(angle)) {

            TweenMax.to('#RedCarObject', 0, { rotation: angle });
        }

        oldCarPosition = newCarPosition;
    }
}

SlotBot.didUpdatePosition = function(positionPercentage) {
    timeline.progress( (positionPercentage + SlotBot.progressOffset) % 1.0 );
    updateRotationForPosition(positionPercentage);
};


// Handle key
document.onkeydown = function (e) {
    e = e || window.event;
    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            didPressUp();
        break;
    }
};
document.onkeyup = function (e) {
    e = e || window.event;
    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            didEndPressUp();
        break;
    }
};

function didPressUp() {
    //SlotBot.move(0.01); // debug only
    SlotBot.isThrottlePressed = true;

}

function didEndPressUp() {
    SlotBot.isThrottlePressed = false;
}

function formatTime(value) {
    value = parseFloat(value);
    var formatedTime = value.toFixed(2);
    if (formatedTime < 10) {
        formatedTime = '0'+formatedTime;
    }
    return formatedTime;
}




















var trackStartTime = 0;




    var ws = new WebSocket('ws://localhost:8891/ws');
    ws.onopen = function(){
      //$message.attr("class", 'label label-success');
      //$message.text('open');
    };
    ws.onmessage = function(ev){
      //$message.attr("class", 'label label-info');
      //$message.hide();
      //$message.fadeIn("slow");
      //$message.text('recieved message');
      var json = JSON.parse(ev.data);
      console.log(json);

      if (json['command'] == 'countdown') {
        trackStartTime = json['time'];


      } else if (json['command'] == 'start') {

        trackStartTime = json['time'];
        SlotBot.startTimer();
    
    } else if (json['command'] == 'stop') {

        SlotBot.stopTimer();

      } else if (json['command'] == 'lap') {

        var took =  ( json['time'] - trackStartTime)  / 1000.0 ;
        SlotBotRanking.didLap(json['player'], took );

        trackStartTime = json['time'];


        console.log("LAP " + json['player'] + " = " + took );

      } 


    };
    ws.onclose = function(ev){
      //$message.attr("class", 'label label-important');
      //$message.text('closed');
    };
    ws.onerror = function(ev){
      //$message.attr("class", 'label label-warning');
      //$message.text('error occurred');
    };