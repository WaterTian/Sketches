// index.js
'use strict';
const PORT_SOCKET = 9876;
let app    = require('express')();
let server = app.listen(PORT_SOCKET);
let io     = require('socket.io')(server);

const glm = require('gl-matrix');

var random = function(min, max) { return min + Math.random() * (max - min);	}

const {vec3, mat4} = glm;


//	OSC EMITTER

const PORT_EMIT_OSC = 8909;
const OscEmitter = require("osc-emitter");

let emitter = new OscEmitter();
emitter.add('localhost', PORT_EMIT_OSC);


//	WEB SOCKETS

io.on('connection', (socket)=>_onConnected(socket));

function _onConnected(socket) {
	console.log('A user is connected : ', socket.id);

	socket.on('disconnect', ()=>_onDisconnected() );
	socket.on('particlePosition', (positions, frame)=>_onParticlePositions(positions, frame));
	socket.on('frame', (frame)=>_onFrame(frame));
	socket.on('position', (positions)=>_onPosition(positions));
}


function _onDisconnected() {
	console.log('User disconnected');
}


let _frame = 0;


const getMatrixString = function(m, index=0) {
	const off = [-m[12], m[13], m[14]];

	console.log(index, off, m);
	const v1 = [m[0], m[1], m[2]];
	const v2 = [m[4], m[5], m[6]];
	const v3 = [m[8], m[9], m[10]];

	let mtx = off.concat(v1).concat(v2).concat(v3);
	mtx.push(index);

	let str = mtx.toString();
	str = str.replace('[', '')
	str = str.replace(']', '')
	str = str.replace(/\,/g, ' ')

	return str;
}


function _onFrame(frame) {
	console.log('Frame Change : ', frame);
	emitter.emit('/frame', frame);
	emitter.emit('/update');
}


function _onPosition(positions) {
	const scale = 100;
	const newPos = positions.map(a => a*scale);
	console.log('on Position :', positions.length/3);
}


function _onParticlePositions(positionsCurr, positionsNext) {
	
	let num = positionsCurr.length /3;

	const FRONT = vec3.fromValues(0, 0, -1);
	const scale = 100;

	for(let i=0; i<num; i++) {
		let posCurr = vec3.fromValues(positionsCurr[i*3+0] * scale, positionsCurr[i*3+1] * scale, positionsCurr[i*3+2] * scale);
		let posNext = vec3.fromValues(positionsNext[i*3+0] * scale, positionsNext[i*3+1] * scale, positionsNext[i*3+2] * scale);

		let dir = vec3.create();
		vec3.sub(dir, posNext, posCurr);
		vec3.normalize(dir, dir);

		let axis = vec3.create();
		vec3.cross(axis, dir, FRONT);
		let alpha = vec3.dot(dir, FRONT);
		let theta = Math.acos(alpha);

		// console.log(i, posCurr, posNext);
		// console.log(axis, dir);


		const mtx = mat4.create();
		
		mat4.translate(mtx, mtx, posNext);

		const mtxRotation = mat4.create();
		mat4.fromRotation(mtxRotation, theta, axis);

		mat4.mul(mtx, mtx, mtxRotation);
		// mat4.mul(mtx, mtxRotation, mtx);
		

		// emitter.emit('/positions', positions[i*3], positions[i*3+1], positions[i*3+2], i);

		const str = getMatrixString(mtx, i);
		emitter.emit('/positions', str);
	}


	emitter.emit('/finish');

}


// setInterval(loop, 1000);


function loop() {
	

	let m = mat4.create();
	const scale = 120;
	const r = 2;

	let x = Math.round(random(-r, r) * scale);
	let y = Math.round(random(-r, r) * scale);
	let z = Math.round(random(-r, r) * scale);

	mat4.translate(m, m, vec3.fromValues(x, y, z));
	mat4.rotateY(m, m, Math.random() * Math.PI * 2.0);

	const str = getMatrixString(m);

	// emitter.emit('/positions', mtx[0], mtx[1], mtx[2], mtx[3], mtx[4], mtx[5], mtx[6], mtx[7], mtx[8], mtx[9], mtx[10], mtx[11], mtx[12]);
	emitter.emit('/positions', str);
}



const getPrec = (num) => {
	const prec = 100;
	const _num = Math.floor(num * prec) / prec;
	return _num;
}


const getArrayString = (ary) => {
	let str = ary.toString();
	str = str.replace('[', '')
	str = str.replace(']', '')
	str = str.replace(/\,/g, ' ')

	return str;
}

function testPosition() {
	let positions = [];

	const num = Math.pow(10, 2);

	const r = 200;

	for(let i=0; i<num; i++) {
		positions.push(random(-r, r));
		positions.push(random(-r, r));
		positions.push(random(-r, r));
	}

	positions = positions.map( n => getPrec(n) );
	const strPosition = getArrayString(positions);

	emitter.emit('/positions', strPosition);
}


testPosition();


/*
//	OSC RECEIVER

const PORT_OSC = 7110;
const OscReceiver = require("osc-receiver");

let receiver = new OscReceiver();
receiver.bind(PORT_OSC);


//	OSC MESSAGES HANDLING

receiver.on('/cameraPos', function(x, y, z) {
	console.log('Camera Position : ', x, y, z);
	io.emit('cameraPosition', {x:-x, y:y, z:z})
});

receiver.on('/lightPos', function(x, y, z) {
	console.log('Light Position : ', x, y, z);
	io.emit('lightPosition', {x:-x, y:y, z:z})
});

*/
