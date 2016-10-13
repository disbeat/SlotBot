var path = MorphSVGPlugin.pathDataToBezier("#motionPath");

TweenMax.to("#circle", 5, {
    bezier:{
        values: path,
        type: 'cubic'
    },
    ease:Linear.easeNone,
    repeat: -1
});

function SlotLap() {

    this.active = false;
    var stopwatch;
    var stopwatchTime = 0;
    var stopwatchInterval = 100; // ms
    var speed = 1;

    // Each stopwatch iteration
    function _stopwatch() {
        stopwatchTime += 0.1;
        console.log('Stopwatch time', stopwatchTime);
    }

    this.startLap = function() {
        this.active = true;
        stopwatch = setInterval(_stopwatch, stopwatchInterval);
    };

    this.stopLap = function() {
        this.active = false;
        clearInterval(stopwatch);
    };

    this.resetLap = function() {
        this.stopLap();
        stopwatchTime = 0;
    };

    this.isActive = function() {
        return this.active;
    };

    this.setSpeed = function() {

    };

    this.acelerate = function() {
        console.log('Should acelerate');
    };

    return this;
}

function Progress(params) {

    console.log(params);

    // Params
    // { previewProgressEl: null }

    var progress = 0;
    var progressMin = 0;
    var progressMax = 100;
    var step = 0.1;
    var domPreview = params.previewProgressEl;

    this.moveForward = function() {
        console.log('Move forward');
        if ( progress < progressMax )
            ++progress;
        console.log('progress', progress);
        setPreviewValue(progress);
    };

    this.moveBackward = function() {
        console.log('Move backward');
        if ( progress > progressMin )
            --progress;
        console.log('progress', progress);
        setPreviewValue(progress);
    };

    this.stop = function() {
        console.log('Stop');
    };

    function setPreviewValue(value) {
        domPreview.value = value;
        //domPreview.getElementsByTagName('span')[0].innerHTML = Math.floor((100 / 70) * value);
    }

    return this;
}

var lap = new SlotLap();
var progress = new Progress({ previewProgressEl: document.getElementById('progress') });

document.onkeydown = function (e) {
    e = e || window.event;
    switch (e.key) {
        case 'ArrowUp':
            didPressUp();
        break;
        case 'ArrowDown':
            didPressDown();
        break;
    }
};

function didPressUp() {
    progress.moveForward();

    return;
    console.log('didPressUp');
    console.log('Is lap active', lap.isActive());
    if ( !lap.isActive() ) {
        lap.startLap();
    } else {
        lap.acelerate();
    }
}

function didPressDown() {
    progress.moveBackward();
    return;
    console.log('didPressDown');
    console.log('Is lap active', lap.isActive());
    lap.stopLap();
}

// Lap start on up press
// Speed increases on up upress
// Lap resets on loop
// Lap stops on down press
