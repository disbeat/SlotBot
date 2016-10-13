"use strict";

// given
var oldVelocity = 0;
var oldTimestamp = 0;
var oldThrottle = 0;

// game physics
var MAX_VEL = 0.5;
var FRICTION = 0.2;
var G = 0.3;

// track caracterization
var track_details = [{'curve1': 0.284, 'curve2': 0.891, 'loop': 0.521}, {'curve1': 0.483, 'curve2': 0.873, 'loop': 0.16}];
var CURVE_LENGTH = 0.15;
var LOOP_LENGTH = 0.25;

var MAX_CURVE_SPEED = 0.4;
var MIN_LOOP_SPEED = 0.15;


function getAcceleration( pos, vel, throttle, deltaThrottle, deltaTime, trackId ){

	var direction = 1;
	if (vel < 0) direction = -1;

	var frictionForce = 0;

	var throttleVel = throttle * MAX_VEL;

	// first level force: friction


	if (throttle == 0 || vel > 0.2) {
		frictionForce =  -direction * Math.min( FRICTION, Math.abs(vel / deltaTime) ) ;
	}

	var throttleForce = 0;
	if (deltaThrottle > 0 || vel < throttleVel) {
		throttleForce =  throttleVel;
	}

	// second level force: track
	var trackForce = getTrackForce( pos, trackId );

	//console.log(trackForce + " " + frictionForce + " " + throttleForce);

	return trackForce + frictionForce + throttleForce;

}


function getTrackPosition( deltaTimestamp, throttlePercentage, positionPercentage, trackId ) {

	if (deltaTimestamp == 0) return {'position' : positionPercentage, 'acceleration' : 0, 'velocity' : 0};;

	



	// update throttle
	var deltaThrottle = throttlePercentage - oldThrottle;
	oldThrottle = throttlePercentage;

	var a = getAcceleration( positionPercentage, oldVelocity, throttlePercentage, deltaThrottle, deltaTimestamp, trackId );

	// update velocity
	var v = oldVelocity + a * deltaTimestamp;
	if (Math.abs(v) < 0.01) v = 0; // correct tremor
	oldVelocity = v;

	// update position
	var pos = positionPercentage + v*deltaTimestamp + 0.5 * a * Math.pow(deltaTimestamp, 2);
	//if (pos > 1)
	//	pos = pos % 1;


	var crash = didCrash(pos, v, trackId);

	//console.log(timestamp + ";" + throttlePercentage + ";" + pos + ";" + a + ";" + v);

	//if (crash)
	//	alert('crash');

	return {'position' : pos, 'acceleration' : a, 'velocity' : v, 'didCrash' : crash};
}

function getTrackForceCurve( pos ) {
	// percentage of track size

	if (pos < 0 || pos > CURVE_LENGTH)
		return 0;

	return -0.02; // TO BE VERIFIED
}


function getTrackForceLoop( pos ) {


	if (pos < 0 || pos > LOOP_LENGTH)
		return 0;


	if (pos < LOOP_LENGTH/2)
		// first part of the loop, legative acceleration
		//return pos / (LOOP_LENGTH / 2) * -G;
		return -G;
	else
		// second part of the loop, positive acceleration
		//return (1 - (pos - (LOOP_LENGTH / 2)) / (LOOP_LENGTH / 2)) * G;
		return G;

}



function getTrackForce(pos, trackId) {
	return getTrackForceCurve(pos - track_details[trackId].curve1) + getTrackForceCurve(pos - track_details[trackId].curve2) + getTrackForceLoop(pos - track_details[trackId].loop);

}


function didCrash(pos, vel, trackId) {

	// check for curves

	var curves = [track_details[trackId].curve1, track_details[trackId].curve2];

	for (var curveIdx in curves) {
		var curve = curves[curveIdx];
		if ( pos > curve & pos < curve + CURVE_LENGTH ){ // is in curve
			console.log('curve: '+ vel);
			if (vel > MAX_CURVE_SPEED)
				return true;
		}
	}


	// check for loop
	var loop = track_details[trackId].loop;
	if (pos > loop + 0.3*LOOP_LENGTH && pos < loop + 0.5*LOOP_LENGTH) { // is in loop critical region
		console.log('loop: '+ vel);
		if (vel < MIN_LOOP_SPEED)
			return true;
	}

	return false;
}
