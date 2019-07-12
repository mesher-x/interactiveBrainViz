// Neuron ----------------------------------------------------------------

function Neuron( idx, x, y, z ) {
	this.idx = idx;
	this.connection = [];
	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;
	this.prevReleaseAxon = null;
	this.signalCount = 0;
	this.signalTimer = 0;
	this.fireRoot = 0;
	THREE.Vector3.call( this, x, y, z );

}

Neuron.prototype = Object.create( THREE.Vector3.prototype );

Neuron.prototype.connectNeuronTo = function ( neuronB ) {

	var neuronA = this;
	// create axon and establish connection
	var axon = new Axon( neuronA, neuronB );
	neuronA.connection.push( new Connection( axon, 'A' ) );
	neuronB.connection.push( new Connection( axon, 'B' ) );
	return axon;

};

Neuron.prototype.createSignal = function ( particlePool, minSpeed, maxSpeed ) {

	this.firedCount += 1;
	this.receivedSignal = false;

	var signals = [];
	// create signal to all connected axons
	for ( var i = 0; i < this.connection.length; i++ ) {
		if ( this.connection[ i ].axon !== this.prevReleaseAxon ) {
			var c = new Signal( particlePool, minSpeed, maxSpeed );
			c.setConnection( this.connection[ i ] );
			signals.push( c );
		}
	}
	this.signalCount = signals.length;
	return signals;

};

Neuron.prototype.reset = function () {

	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;
	this.signalCount = 0;
	this.signalTimer = 0;
};

// Signal extends THREE.Vector3 ----------------------------------------------------------------

function Signal( particlePool, minSpeed, maxSpeed ) {

	this.minSpeed = minSpeed;
	this.maxSpeed = maxSpeed;
	this.speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
	this.alive = true;
	this.t = null;
	this.startingPoint = null;
	this.axon = null;
	this.particle = particlePool.getParticle();
	THREE.Vector3.call( this );
}

Signal.prototype = Object.create( THREE.Vector3.prototype );

Signal.prototype.setConnection = function ( Connection ) {

	this.startingPoint = Connection.startingPoint;
	this.axon = Connection.axon;
	if ( this.startingPoint === 'A' ) this.t = 0;
	else if ( this.startingPoint === 'B' ) this.t = 1;

};

Signal.prototype.travel = function ( deltaTime ) {

	var pos;
	if ( this.startingPoint === 'A' ) {
		this.t += this.speed * deltaTime;
		if ( this.t >= 1 ) {
			this.t = 1;
			this.alive = false;
			this.axon.neuronA.signalCount--;
			this.axon.neuronB.receivedSignal = true;
			this.axon.neuronB.prevReleaseAxon = this.axon;
		}

	} else if ( this.startingPoint === 'B' ) {
		this.t -= this.speed * deltaTime;
		if ( this.t <= 0 ) {
			this.t = 0;
			this.alive = false;
			this.axon.neuronB.signalCount--;
			this.axon.neuronA.receivedSignal = true;
			this.axon.neuronA.prevReleaseAxon = this.axon;
		}
	}

	pos = this.axon.getPoint( this.t );
	// pos = this.axon.getPointAt(this.t);	// uniform point distribution but slower calculation

	this.particle.set( pos.x, pos.y, pos.z );
};

// Static Signal ---------------------------------------------------------

function StaticSignal(signalVisible, signalPos, signalSize, signalColor, signalInterval) {

	this.spriteTextureSignal = TEXTURES.electric;

	this.pGeom = new THREE.Geometry();
	this.particles = this.pGeom.vertices;


	this.pColor = signalColor;
	this.pSize = 4 * signalSize;

	this.particles[0] = new THREE.Vector3(0,0,0);

	this.meshComponents = new THREE.Object3D();
	this.meshComponents.visible = signalVisible;
	this.meshComponents.position.set(signalPos.x, signalPos.y, signalPos.z);

	// inner particle
	this.pMat = new THREE.PointCloudMaterial({
		map: this.spriteTextureSignal,
		size: this.pSize,
		color: this.pColor,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	});

	this.pMesh = new THREE.PointCloud(this.pGeom, this.pMat);
	this.pMesh.frustumCulled = false;

	this.meshComponents.add(this.pMesh);


	// outer particle glow
	this.pMat_outer = this.pMat.clone();
	this.pMat_outer.size = this.pSize * 10;
	this.pMat_outer.opacity = 0.1;

	this.pMesh_outer = new THREE.PointCloud(this.pGeom, this.pMat_outer);
	this.pMesh_outer.frustumCulled = false;

	this.meshComponents.add(this.pMesh_outer);

	this.interval = signalInterval;
	this.timer = 0;
}

StaticSignal.prototype.getAvgExecutionTime = function () {
	return this.profTime / this.itt;
};

StaticSignal.prototype.getParticle = function () {

	var p = this.particles[0];
	return p;
};

StaticSignal.prototype.update = function (deltaTime) {
	this.timer += deltaTime * 6 / (this.interval / 1000);
	this.pMat.size = this.pSize * Math.sin(this.timer);
	this.pMat_outer.size = this.pSize * 10 * Math.sin(this.timer);
	this.pGeom.verticesNeedUpdate = true;
};

StaticSignal.prototype.updateSettings = function () {

	// inner particle
	this.pMat.color.setStyle(this.pColor);
	this.pMat.size = this.pSize;
	// outer particle
	this.pMat_outer.color.setStyle(this.pColor);
	this.pMat_outer.size = this.pSize * 10;

};

// Particle Pool ---------------------------------------------------------

function ParticlePool( poolSize, signalSize ) {

	this.spriteTextureSignal = TEXTURES.electric;

	this.poolSize = poolSize;
	this.pGeom = new THREE.Geometry();
	this.particles = this.pGeom.vertices;

	this.offScreenPos = new THREE.Vector3( 9999, 9999, 9999 );

	this.pColor = '#ff0000';
	this.pSize = 2 * signalSize;

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		this.particles[ ii ] = new Particle( this );
	}

	this.meshComponents = new THREE.Object3D();

	// inner particle
	this.pMat = new THREE.PointCloudMaterial( {
		map: this.spriteTextureSignal,
		size: this.pSize,
		color: this.pColor,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.pMesh = new THREE.PointCloud( this.pGeom, this.pMat );
	this.pMesh.frustumCulled = false;

	this.meshComponents.add( this.pMesh );


	// outer particle glow
	this.pMat_outer = this.pMat.clone();
	this.pMat_outer.size = this.pSize * 10;
	this.pMat_outer.opacity = 0.06;

	this.pMesh_outer = new THREE.PointCloud( this.pGeom, this.pMat_outer );
	this.pMesh_outer.frustumCulled = false;

	this.meshComponents.add( this.pMesh_outer );

}

ParticlePool.prototype.getAvgExecutionTime = function () {
	return this.profTime / this.itt;
};

ParticlePool.prototype.getParticle = function () {

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		var p = this.particles[ ii ];
		if ( p.available ) {
			this.lastAvailableIdx = ii;
			p.available = false;
			return p;
		}
	}

	console.error( "ParticlePool.prototype.getParticle return null" );
	return null;

};

ParticlePool.prototype.update = function () {
	this.pGeom.verticesNeedUpdate = true;
};

ParticlePool.prototype.updateSettings = function () {

	// inner particle
	this.pMat.color.setStyle( this.pColor );
	this.pMat.size = this.pSize;
	// outer particle
	this.pMat_outer.color.setStyle( this.pColor );
	this.pMat_outer.size = this.pSize * 10;

};

// Particle --------------------------------------------------------------
// Private class for particle pool

function Particle( particlePool ) {

	this.particlePool = particlePool;
	this.available = true;
	THREE.Vector3.call( this, this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );
	
}

Particle.prototype = Object.create( THREE.Vector3.prototype );

Particle.prototype.free = function () {

	this.available = true;
	this.set( this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );
};

// Axon extends THREE.CubicBezierCurve3 ------------------------------------------------------------------
/* exported Axon, Connection */

function Axon( neuronA, neuronB ) {

	this.bezierSubdivision = 8;
	this.neuronA = neuronA;
	this.neuronB = neuronB;
	this.cpLength = neuronA.distanceTo( neuronB ) / THREE.Math.randFloat( 1.5, 4.0 );
	this.controlPointA = this.getControlPoint( neuronA, neuronB );
	this.controlPointB = this.getControlPoint( neuronB, neuronA );
	THREE.CubicBezierCurve3.call( this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB );

	this.vertices = this.getSubdividedVertices();

}

Axon.prototype = Object.create( THREE.CubicBezierCurve3.prototype );

Axon.prototype.getSubdividedVertices = function () {
	return this.getSpacedPoints( this.bezierSubdivision );
};

// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
Axon.prototype.getControlPoint = function ( v1, v2 ) {

	var dirVec = new THREE.Vector3().copy( v2 ).sub( v1 ).normalize();
	var northPole = new THREE.Vector3( 0, 0, 1 ); // this is original axis where point get sampled
	var axis = new THREE.Vector3().crossVectors( northPole, dirVec ).normalize(); // get axis of rotation from original axis to dirVec
	var axisTheta = dirVec.angleTo( northPole ); // get angle
	var rotMat = new THREE.Matrix4().makeRotationAxis( axis, axisTheta ); // build rotation matrix

	var minz = Math.cos( THREE.Math.degToRad( 45 ) ); // cone spread in degrees
	var z = THREE.Math.randFloat( minz, 1 );
	var theta = THREE.Math.randFloat( 0, Math.PI * 2 );
	var r = Math.sqrt( 1 - z * z );
	var cpPos = new THREE.Vector3( r * Math.cos( theta ), r * Math.sin( theta ), z );
	cpPos.multiplyScalar( this.cpLength ); // length of cpPoint
	cpPos.applyMatrix4( rotMat ); // rotate to dirVec
	cpPos.add( v1 ); // translate to v1
	return cpPos;

};

// Connection ------------------------------------------------------------
function Connection( axon, startingPoint ) {
	this.axon = axon;
	this.startingPoint = startingPoint;
}

function CommentLabel(label, targetObj) {
  this.div = document.createElement('div');
  this.div.style.position = 'absolute';
  this.div.innerHTML = label.text;
  this.div.style.top = -1000;
  this.div.style.left = -1000;
  this.div.style.color = label.color;
  this.div.style.visibility = label.visible ? 'visible' : 'hidden';
  this.div.style.fontSize = label.size;
  this.div.classList.add('comment-label');
  this.parent = targetObj;
  this.position = new THREE.Vector3(0, 0, 0);
  container.appendChild(this.div);

}

CommentLabel.prototype.setHTML = function (html) {
  this.div.innerHTML = html;
}

CommentLabel.prototype.setParent = function (threejsobj) {
  this.parent = threejsobj;
}

CommentLabel.prototype.updatePosition = function () {
  if (this.parent) {
    var pos = new THREE.Vector3(this.parent.position.x, this.parent.position.y+contextBoxSize / 2, this.parent.position.z);
    this.position.copy(pos);
  }

  var coords2d = this.get2DCoords();
  this.div.style.left = coords2d.x - this.div.offsetWidth / 2 + 'px';
  this.div.style.top = coords2d.y - this.div.offsetHeight + 'px';
}

CommentLabel.prototype.get2DCoords = function () {
  var vector = this.position.project(camera);
  vector.x = (vector.x + 1) / 2 * window.innerWidth;
  vector.y = -(vector.y - 1) / 2 * window.innerHeight;
  return vector;
}
// Context box ----------------------------------------------------------------

function Conbox(id, pos, visible, label) {
	this.id = id;
	this.component = new THREE.Object3D();
	this.component.position.set(pos.x, pos.y, pos.z);
	this.component.visible = visible;

	//label
	this.comment = new CommentLabel(label, this.component);
    
}




// Neural Network --------------------------------------------------------

function NeuralNetwork() {

	this.initialized = false;

	this.settings = {
		/*default
		verticesSkipStep       : 2,
		maxAxonDist            : 10,
		maxConnectionsPerNeuron: 6,
		signalMinSpeed         : 1.75,
		signalMaxSpeed         : 3.25,
		currentMaxSignals      : 3000,
		limitSignals           : 10000
		*/

		verticesSkipStep: 4,
		maxAxonDist: 10,
		maxConnectionsPerNeuron: 6,
		signalMinSpeed: 0.35,
		signalMaxSpeed: 0.85,
		currentMaxSignals: 1000,
		limitSignals: 3000

	};

	this.meshComponents = new THREE.Object3D();

	this.particlePools = [];
	for (var ii = 0; ii < SignalData.length; ii++) {
		var pp = new ParticlePool(this.settings.limitSignals, SignalData[ii].size);
		this.meshComponents.add(pp.meshComponents);
		this.particlePools.push(pp);
	}

	// NN component containers
	this.components = {
		neurons: [],
		allSignals: [],
		allAxons: [],
		allComments: []
	};

	// axon
	this.axonOpacityMultiplier = 0.1;
	this.axonColor = '#ffffff';
	this.axonGeom = new THREE.BufferGeometry();
	this.axonPositions = [];
	this.axonIndices = [];
	this.axonNextPositionsIndex = 0;

	this.axonUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color(this.axonColor)
		},
		opacityMultiplier: {
			type: 'f',
			value: this.axonOpacityMultiplier
		}
	};

	this.axonAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};

	// neuron
	this.neuronSizeMultiplier = 0.4;
	this.spriteTextureNeuron = TEXTURES.electric;
	this.neuronColor = '#ffffff';
	this.neuronOpacity = 0.3;
	this.neuronsGeom = new THREE.Geometry();

	this.neuronUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: this.neuronSizeMultiplier
		},
		opacity: {
			type: 'f',
			value: this.neuronOpacity
		},
		texture: {
			type: 't',
			value: this.spriteTextureNeuron
		}
	};

	this.neuronAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.neuronShaderMaterial = new THREE.ShaderMaterial({

		uniforms: this.neuronUniforms,
		attributes: this.neuronAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false

	});

	//Context box
	var conboxMaterial = new THREE.LineBasicMaterial({
		color: 0x009faf,
		linewidth: 1,

	});
	this.conboxRoot = new THREE.Object3D();
	var conboxGeometry = new THREE.Geometry();
	//
	// Cube geometry
	//
	//   4+--------+7
	//   /|       /|
	// 5+--------+6|
	//  | |      | |
	//  |0+------|-+3
	//  |/       |/
	// 1+--------+2
	//
	var cube_vertices = [
		[-contextBoxSize/2, -contextBoxSize/2, -contextBoxSize/2],
		[contextBoxSize/2, -contextBoxSize/2, -contextBoxSize/2],
		[contextBoxSize/2, contextBoxSize/2, -contextBoxSize/2],
		[-contextBoxSize/2, contextBoxSize/2, -contextBoxSize/2],
		[-contextBoxSize/2, -contextBoxSize/2, contextBoxSize/2],
		[contextBoxSize/2, -contextBoxSize/2, contextBoxSize/2],
		[contextBoxSize/2, contextBoxSize/2, contextBoxSize/2],
		[-contextBoxSize/2, contextBoxSize/2, contextBoxSize/2]
	];
	var cube_edges = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 0],
		[0, 4],
		[4, 5],
		[5, 6],
		[6, 7],
		[7, 4],
		[4, 7],
		[7, 3],
		[3, 2],
		[2, 6],
		[6, 5],
		[5, 1]
	];
	for (var ii = 0; ii < cube_edges.length; ii++) {
		// Add first vertex of edge
		conboxGeometry.vertices.push(new THREE.Vector3(
			cube_vertices[cube_edges[ii][0]][0],
			cube_vertices[cube_edges[ii][0]][1],
			cube_vertices[cube_edges[ii][0]][2]
		)
		);
		// Add second vertex of edge
		conboxGeometry.vertices.push(new THREE.Vector3(
			cube_vertices[cube_edges[ii][1]][0],
			cube_vertices[cube_edges[ii][1]][1],
			cube_vertices[cube_edges[ii][1]][2]
		)
		);
	}
	this.conboxMesh = new THREE.Line(conboxGeometry, conboxMaterial);

	//Static Signal
	this.staticSignals = [];


	// info api
	this.numNeurons = 0;
	this.numAxons = 0;
	this.numSignals = 0;

	this.numPassive = 0;


	// initialize NN
	this.initNeuralNetwork();

}

NeuralNetwork.prototype.initNeuralNetwork = function () {

	this.initNeurons(OBJ_MODELS.brain.geometry.vertices);
	this.initAxons();
	this.initConboxes();

	this.neuronShaderMaterial.vertexShader = SHADER_CONTAINER.neuronVert;
	this.neuronShaderMaterial.fragmentShader = SHADER_CONTAINER.neuronFrag;

	this.axonShaderMaterial.vertexShader = SHADER_CONTAINER.axonVert;
	this.axonShaderMaterial.fragmentShader = SHADER_CONTAINER.axonFrag;

	this.initialized = true;

};

NeuralNetwork.prototype.initNeurons = function (inputVertices) {

	var i;
	for (i = 0; i < inputVertices.length; i += this.settings.verticesSkipStep) {
		var pos = inputVertices[i];
		var n = new Neuron(i, pos.x, pos.y, pos.z);
		this.components.neurons.push(n);
		this.neuronsGeom.vertices.push(n);
		// dont set neuron's property here because its skip vertices
	}

	// set neuron attributes value
	for (i = 0; i < this.components.neurons.length; i++) {
		this.neuronAttributes.color.value[i] = new THREE.Color('#ffffff'); // initial neuron color
		this.neuronAttributes.size.value[i] = THREE.Math.randFloat(0.75, 3.0); // initial neuron size
	}


	// neuron mesh
	this.neuronParticles = new THREE.PointCloud(this.neuronsGeom, this.neuronShaderMaterial);
	this.meshComponents.add(this.neuronParticles);

	this.neuronShaderMaterial.needsUpdate = true;

};

NeuralNetwork.prototype.initAxons = function () {

	var allNeuronsLength = this.components.neurons.length;
	for (var j = 0; j < allNeuronsLength; j++) {
		var n1 = this.components.neurons[j];
		for (var k = j + 1; k < allNeuronsLength; k++) {
			var n2 = this.components.neurons[k];
			// connect neuron if distance is within threshold and limit maximum connection per neuron
			if (n1 !== n2 && n1.distanceTo(n2) < this.settings.maxAxonDist &&
				n1.connection.length < this.settings.maxConnectionsPerNeuron &&
				n2.connection.length < this.settings.maxConnectionsPerNeuron) {
				var connectedAxon = n1.connectNeuronTo(n2);
				this.constructAxonArrayBuffer(connectedAxon);
			}
		}
	}

	// enable WebGL 32 bit index buffer or get an error
	if (!renderer.getContext().getExtension("OES_element_index_uint")) {
		console.error("32bit index buffer not supported!");
	}

	var axonIndices = new Uint32Array(this.axonIndices);
	var axonPositions = new Float32Array(this.axonPositions);
	var axonOpacities = new Float32Array(this.axonAttributes.opacity.value);

	this.axonGeom.addAttribute('index', new THREE.BufferAttribute(axonIndices, 1));
	this.axonGeom.addAttribute('position', new THREE.BufferAttribute(axonPositions, 3));
	this.axonGeom.addAttribute('opacity', new THREE.BufferAttribute(axonOpacities, 1));
	this.axonGeom.computeBoundingSphere();

	this.axonShaderMaterial = new THREE.ShaderMaterial({
		uniforms: this.axonUniforms,
		attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	});

	this.axonMesh = new THREE.Line(this.axonGeom, this.axonShaderMaterial, THREE.LinePieces);
	this.meshComponents.add(this.axonMesh);


	var numNotConnected = 0;
	for (i = 0; i < allNeuronsLength; i++) {
		if (!this.components.neurons[i].connection[0]) {
			numNotConnected += 1;
		}
	}
	// console.log( 'numNotConnected =', numNotConnected );

};


NeuralNetwork.prototype.initConboxes = function () {

	for (var i = 0; i < DATASET.length; i++) {
		//Context box
		var boxPos = new THREE.Vector3(DATASET[i].x * contextBoxSize - brainSizeX / 2 + contextBoxSize/2, DATASET[i].y * contextBoxSize - brainSizeY / 2 + contextBoxSize/2, DATASET[i].z * contextBoxSize - brainSizeZ / 2 + contextBoxSize/2);
		var conbox = new Conbox(i, boxPos, DATASET[i].visible, DATASET[i].label);
		var box = this.conboxMesh.clone();
		conbox.component.add(box);
		this.conboxRoot.add(conbox.component);
		this.components.allComments.push(conbox.comment);

		//Static signals
		for(var j=0; j<DATASET[i].signals.length; j++){
			var signalInfo = DATASET[i].signals[j];
			var spos = new THREE.Vector3(boxPos.x - contextBoxSize/2 + signalInfo.position.x * contextBoxSize / 100, boxPos.y - contextBoxSize/2 + signalInfo.position.y * contextBoxSize / 100, boxPos.z - contextBoxSize/2 + signalInfo.position.z * contextBoxSize / 100);
			var s = new StaticSignal(signalInfo.visible, spos, signalInfo.size, signalInfo.color, signalInfo.interval);
			this.staticSignals.push(s);
			this.conboxRoot.add(s.meshComponents);
		}
	}
	this.meshComponents.add(this.conboxRoot);
};         

NeuralNetwork.prototype.update = function (deltaTime) {

	if (!this.initialized) return;

	var n, ii;
	var currentTime = Date.now();

	// update neurons state and release signal
	// for (ii = 0; ii < this.components.neurons.length; ii++) {

	// 	n = this.components.neurons[ii];

	// 	if (this.components.allSignals.length < this.settings.currentMaxSignals - this.settings.maxConnectionsPerNeuron) { // limit total signals currentMaxSignals - maxConnectionsPerNeuron because allSignals can not bigger than particlePool size

	// 		if (n.receivedSignal) { // Traversal mode
	// 			// if (n.receivedSignal && (currentTime - n.lastSignalRelease > n.releaseDelay) && n.firedCount < 8)  {	// Random mode
	// 			// if (n.receivedSignal && !n.fired )  {	// Single propagation mode
	// 			n.fired = true;
	// 			n.lastSignalRelease = currentTime;
	// 			n.releaseDelay = THREE.Math.randInt(100, 1000);
	// 			this.releaseSignalAt(n);
	// 		}

	// 	}

	// 	n.receivedSignal = false; // if neuron recieved signal but still in delay reset it
	// }

	// reset all neurons and when there is no signal and trigger release signal at random neuron
	// if (this.components.allSignals.length === 0) {
	// 	this.resetAllNeurons();
	// 	this.releaseSignalAt( this.components.neurons[ THREE.Math.randInt( 0, this.components.neurons.length ) ] );
	// }


	for (var ii = 0; ii < SignalData.length; ii++) {
		this.components.neurons[SignalData[ii].neuron_id].signalTimer += deltaTime;
		if (this.components.neurons[SignalData[ii].neuron_id].signalCount === 0 && this.components.neurons[SignalData[ii].neuron_id].signalTimer > SignalData[ii].interval) {
			this.components.neurons[SignalData[ii].neuron_id].reset();
			this.releaseSignalAt(SignalData[ii].idx, this.components.neurons[SignalData[ii].neuron_id]);
		}
	}


	// update and remove dead signals
	for (var j = this.components.allSignals.length - 1; j >= 0; j--) {
		var s = this.components.allSignals[j];
		s.travel(deltaTime);

		if (!s.alive) {
			s.particle.free();
			for (var k = this.components.allSignals.length - 1; k >= 0; k--) {
				if (s === this.components.allSignals[k]) {
					this.components.allSignals.splice(k, 1);
					break;
				}
			}
		}

	}

	// update position of comment
	for (var ii = 0; ii < this.components.allComments.length; ii++) {
		this.components.allComments[ii].updatePosition();
	}

	// update particle pool vertices
	for (var ii = 0; ii < this.particlePools.length; ii++) {
		this.particlePools[ii].update();
	}

	// update Static signals
	for (var ii = 0; ii < this.staticSignals.length; ii++) {
		this.staticSignals[ii].update(deltaTime);
	}

	// update info for GUI
	this.updateInfo();

};

NeuralNetwork.prototype.constructAxonArrayBuffer = function (axon) {
	this.components.allAxons.push(axon);
	var vertices = axon.vertices;

	for (var i = 0; i < vertices.length; i++) {

		this.axonPositions.push(vertices[i].x, vertices[i].y, vertices[i].z);

		if (i < vertices.length - 1) {
			var idx = this.axonNextPositionsIndex;
			this.axonIndices.push(idx, idx + 1);

			var opacity = THREE.Math.randFloat(0.005, 0.2);
			this.axonAttributes.opacity.value.push(opacity, opacity);

		}

		this.axonNextPositionsIndex += 1;
	}
};

NeuralNetwork.prototype.releaseSignalAt = function (signal_idx, neuron) {
	var signals = neuron.createSignal(this.particlePools[signal_idx], this.settings.signalMinSpeed, this.settings.signalMaxSpeed);
	for (var ii = 0; ii < signals.length; ii++) {
		var s = signals[ii];
		this.components.allSignals.push(s);
	}
};

NeuralNetwork.prototype.resetAllNeurons = function () {

	this.numPassive = 0;
	for (var ii = 0; ii < this.components.neurons.length; ii++) { // reset all neuron state
		n = this.components.neurons[ii];

		if (!n.fired) {
			this.numPassive += 1;
		}

		n.reset();

	}
	// console.log( 'numPassive =', this.numPassive );

};

NeuralNetwork.prototype.updateInfo = function () {
	this.numNeurons = this.components.neurons.length;
	this.numAxons = this.components.allAxons.length;
	this.numSignals = this.components.allSignals.length;
};

NeuralNetwork.prototype.updateSettings = function () {

	this.neuronUniforms.opacity.value = this.neuronOpacity;

	for (i = 0; i < this.components.neurons.length; i++) {
		this.neuronAttributes.color.value[i].setStyle(this.neuronColor); // initial neuron color
	}
	this.neuronAttributes.color.needsUpdate = true;

	this.neuronUniforms.sizeMultiplier.value = this.neuronSizeMultiplier;

	this.axonUniforms.color.value.set(this.axonColor);
	this.axonUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;

	for (i = 0; i < this.particlePools.length; i++) {
		this.particlePools[i].updateSettings();
	}


};

NeuralNetwork.prototype.testChangOpcAttr = function () {

	var opcArr = this.axonGeom.attributes.opacity.array;
	for (var i = 0; i < opcArr.length; i++) {
		opcArr[i] = THREE.Math.randFloat(0, 0.5);
	}
	this.axonGeom.attributes.opacity.needsUpdate = true;
};

// Assets & Loaders --------------------------------------------------------

var loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {

	document.getElementById( 'loading' ).style.display = 'none'; // hide loading animation when finished
	console.log( 'Done.' );

	main();

};


loadingManager.onProgress = function ( item, loaded, total ) {

	// console.log( loaded + '/' + total, item );

};


var shaderLoader = new THREE.XHRLoader( loadingManager );
shaderLoader.setResponseType( 'text' );

shaderLoader.loadMultiple = function ( SHADER_CONTAINER, urlObj ) {

	_.each( urlObj, function ( value, key ) {

		shaderLoader.load( value, function ( shader ) {

			SHADER_CONTAINER[ key ] = shader;

		} );

	} );

};

var SHADER_CONTAINER = {};
shaderLoader.loadMultiple( SHADER_CONTAINER, {

	neuronVert: 'shaders/neuron.vert',
	neuronFrag: 'shaders/neuron.frag',

	axonVert: 'shaders/axon.vert',
	axonFrag: 'shaders/axon.frag'

} );



var OBJ_MODELS = {};
var OBJloader = new THREE.OBJLoader( loadingManager );
OBJloader.load( 'models/brain_vertex_high.obj', function ( model ) {

	OBJ_MODELS.brain = model.children[ 0 ];

} );


var TEXTURES = {};
var textureLoader = new THREE.TextureLoader( loadingManager );
textureLoader.load( 'sprites/electric.png', function ( tex ) {

	TEXTURES.electric = tex;

} );

textureLoader.load( 'sprites/mark.png', function ( tex ) {

	TEXTURES.mark = tex;

} );

// Scene --------------------------------------------------------
/* exported updateHelpers */

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
}

var container, stats;
var scene, light, camera, cameraCtrl, renderer;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var pixelRatio = window.devicePixelRatio || 1;
var screenRatio = WIDTH / HEIGHT;
var clock = new THREE.Clock();
var FRAME_COUNT = 0;

// ---- Settings
var sceneSettings = {

	pause: false,
	bgColor: 0x111113,
	enableGridHelper: false,
	enableAxisHelper: false

};

// ---- Scene
container = document.getElementById('canvas-container');
scene = new THREE.Scene();

// ---- Renderer
renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(pixelRatio);
renderer.setClearColor(sceneSettings.bgColor, 1);
renderer.autoClear = false;
container.appendChild(renderer.domElement);

// ---- Stats
stats = new Stats();
container.appendChild(stats.domElement);

// ---- Camera
camera = new THREE.PerspectiveCamera(75, screenRatio, 0.1, 1000);
camera.position.set(0, 150, 0);
// camera orbit control
cameraCtrl = new THREE.OrbitControls(camera, renderer.domElement);
// cameraCtrl.object.position.z = 150;
// cameraCtrl.object.position.x = 150;
cameraCtrl.autoRotate = false;
cameraCtrl.autoRotateSpeed = 1;
cameraCtrl.enablePan = false;
cameraCtrl.enableRotate = false;



// ---- grid & axis helper
var brainSizeX = 125;
var brainSizeY = 115;
var brainSizeZ = 155;
var contextBoxSize = 5;
var gridHelper = new THREE.GridHelper(brainSizeZ/2, contextBoxSize);
gridHelper.setColors(0x00bbff, 0xffffff);
gridHelper.material.opacity = 0.05;
gridHelper.material.transparent = true;
gridHelper.position.y = -brainSizeY / 2;
scene.add(gridHelper);

var axisHelper = new THREE.AxisHelper(brainSizeZ);
axisHelper.position.x = -brainSizeX / 2;
axisHelper.position.y = -brainSizeY / 2;
axisHelper.position.z = -brainSizeZ / 2;

scene.add(axisHelper);

function updateHelpers() {
	axisHelper.visible = sceneSettings.enableAxisHelper;
	gridHelper.visible = sceneSettings.enableGridHelper;
}



/*
// ---- Lights
// back light
light = new THREE.DirectionalLight( 0xffffff, 0.8 );
light.position.set( 100, 230, -100 );
scene.add( light );

// hemi
light = new THREE.HemisphereLight( 0x00ffff, 0x29295e, 1 );
light.position.set( 370, 200, 20 );
scene.add( light );

// ambient
light = new THREE.AmbientLight( 0x111111 );
scene.add( light );
*/

var comments = [];
// Main --------------------------------------------------------
/* exported main, updateGuiInfo */

var gui, gui_info, gui_settings;

function main() {

	var neuralNet = window.neuralNet = new NeuralNetwork();
	scene.add(neuralNet.meshComponents);

	var geometry = new THREE.PlaneGeometry(180, 180, 1);
	var material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: TEXTURES.mark, combine: THREE.AdditiveBlending, transparent: true, opacity: 0.1 });
	var marker = new THREE.Mesh(geometry, material);
	marker.rotation.set(-Math.PI / 2, 0, 0);
	marker.position.set(0, -80, 0);
	scene.add(marker);

	initGui();
	run();
	// $(gui.domElement).attr("hidden", true);
}



// GUI --------------------------------------------------------
/* exported iniGui, updateGuiInfo */

function initGui() {

	gui = new dat.GUI();
	gui.width = 270;

	// gui_info = gui.addFolder( 'Info' );
	// gui_info.add( neuralNet, 'numNeurons' ).name( 'Neurons' );
	// gui_info.add( neuralNet, 'numAxons' ).name( 'Axons' );
	// gui_info.add( neuralNet, 'numSignals', 0, neuralNet.settings.limitSignals ).name( 'Signals' );
	// gui_info.autoListen = false;

	gui_settings = gui.addFolder( 'Settings' );
	// gui_settings.add( neuralNet.settings, 'currentMaxSignals', 0, neuralNet.settings.limitSignals ).name( 'Max Signals' );
	// gui_settings.add( neuralNet.settings, 'signalMinSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Min Speed' );
	// gui_settings.add( neuralNet.settings, 'signalMaxSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Max Speed' );
	gui_settings.add( neuralNet, 'neuronSizeMultiplier', 0, 2 ).name( 'Neuron Size' );
	gui_settings.add( neuralNet, 'neuronOpacity', 0, 1.0 ).name( 'Neuron Opacity' );
	gui_settings.addColor( neuralNet, 'neuronColor' ).name( 'Neuron Color' );
	gui_settings.add( neuralNet, 'axonOpacityMultiplier', 0.0, 5.0 ).name( 'Axon Opacity' );
	gui_settings.addColor( neuralNet, 'axonColor' ).name( 'Axon Color' );
	gui_settings.addColor( sceneSettings, 'bgColor' ).name( 'Background' );

	// gui_info.open();
	gui_settings.open();

	for ( var i = 0; i < gui_settings.__controllers.length; i++ ) {
		gui_settings.__controllers[ i ].onChange( updateNeuralNetworkSettings );
	}

}

function updateNeuralNetworkSettings() {
	neuralNet.updateSettings();
	if ( neuralNet.settings.signalMinSpeed > neuralNet.settings.signalMaxSpeed ) {
		neuralNet.settings.signalMaxSpeed = neuralNet.settings.signalMinSpeed;
		gui_settings.__controllers[ 3 ].updateDisplay();
	}
}

function updateGuiInfo() {
	// for ( var i = 0; i < gui_info.__controllers.length; i++ ) {
	// 	gui_info.__controllers[ i ].updateDisplay();
	// }
}

// Run --------------------------------------------------------

function update() {

	updateHelpers();

	if (!sceneSettings.pause) {

		var deltaTime = clock.getDelta();
		// neuralNet.meshComponents.rotation.y -= Math.PI / 180 / 8;
		neuralNet.update(deltaTime);
		updateGuiInfo();

	}

}

// ----  draw loop
function run() {

	requestAnimationFrame(run);
	renderer.setClearColor(sceneSettings.bgColor, 1);
	renderer.clear();
	update();
	renderer.render(scene, camera);
	stats.update();
	FRAME_COUNT++;

}

// Events --------------------------------------------------------

window.addEventListener( 'keypress', function ( event ) {

	var key = event.keyCode;

	switch ( key ) {

		case 32:/*space bar*/ sceneSettings.pause = !sceneSettings.pause;
			break;

		case 65:/*A*/
		case 97:/*a*/ sceneSettings.enableGridHelper = !sceneSettings.enableGridHelper;
			break;

		case 83 :/*S*/
		case 115:/*s*/ sceneSettings.enableAxisHelper = !sceneSettings.enableAxisHelper;
			break;

	}

} );


$( function () {
	var timerID;
	$( window ).resize( function () {
		clearTimeout( timerID );
		timerID = setTimeout( function () {
			onWindowResize();
		}, 250 );
	} );
} );


function onWindowResize() {

	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	pixelRatio = window.devicePixelRatio || 1;
	screenRatio = WIDTH / HEIGHT;

	camera.aspect = screenRatio;
	camera.updateProjectionMatrix();

	renderer.setSize( WIDTH, HEIGHT );
	renderer.setPixelRatio( pixelRatio );

}

//Old signals that move along axon
var SignalData = [
	// { idx: 0, neuron_id: 100, interval: 0.5, size: 1 },
	// { idx: 1, neuron_id: 2000, interval: 3, size: 0.1 },
	// { idx: 2, neuron_id: 3000, interval: 4, size: 1.5 },
	// { idx: 3, neuron_id: 4000, interval: 4.7, size: 0.7 },
	// { idx: 4, neuron_id: 5000, interval: 6, size: 0.6 },
	// { idx: 5, neuron_id: 6000, interval: 3.5, size: 0.2 },
	// { idx: 6, neuron_id: 8540, interval: 1.7, size: 0.9 }
]

//Real signal's data
var DATASET = [
	{
		id: 0, 
		x: 12, 
		y: 22, 
		z: 15, 
		visible: false,
		label: { visible: true, text: "Top_Box", size: '18px', color: '#ff00ffff' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 4000, color: '#ff0000', size: 1 }
		]
	},
	{
		id: 1, 
		x: 12, 
		y: 5, 
		z: 15, 
		visible: false,
		label: { visible: true, text: "Bottom_Box", size: '18px', color: '#ff0000ff' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 2000, color: '#00ff00', size: 1.2 },
			{ visible: true, position: { x: 88, y: 88, z: 88 }, interval: 3000, color: '#0000ff', size: 1 }
		]
	},
	{
		id: 2, 
		x: 2, 
		y: 11, 
		z: 15, 
		visible: true,
		label: { visible: true, text: "Right_Box", size: '18px', color: '#ffff00ff' },
		signals: [
			{ visible: true, position: { x: 88, y: 88, z: 88 }, interval: 1500, color: '#ff00ff', size: 1 },
			{ visible: true, position: { x: 44, y: 44, z: 44 }, interval: 2500, color: '#ff0000', size: 1.5 }
		]
	},
	{
		id: 3, 
		x: 22, 
		y: 11, 
		z: 15, 
		visible: true,
		label: { visible: true, text: "Left_Box", size: '18px', color: '#00ffffee' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 5000, color: '#ddff22', size: 1 }
		]
	},
	{
		id: 4, 
		x: 12, 
		y: 11, 
		z: 0, 
		visible: true,
		label: { visible: true, text: "Back_Box", size: '18px', color: '#ffffffee' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 3500, color: '#00ffff', size: 1 }
		]
	},
	{
		id: 5, 
		x: 12, 
		y: 11, 
		z: 28, 
		visible: true,
		label: { visible: true, text: "Front_Box", size: '18px', color: '#ffffffee' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 3500, color: '#00ffff', size: 1 }
		]
	}

]