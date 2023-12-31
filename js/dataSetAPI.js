//Real signal's data
var DATASET = [
	{
		id: 0, 
		x: 12, 
		y: 22, 
		z: 15, 
		visible: false,
		label: { visible: true, text: "Top", size: '18px', color: '#ff0000ff' },
		signals: [
			{ visible: true, position: { x: 0, y: 0, z: 0 }, interval: 4000, color: '#ff0000', size: 1.5, axon_effect: 'show' }
		]
	},
	{
		id: 1, 
		x: 12, 
		y: 5, 
		z: 15, 
		visible: false,
		label: { visible: true, text: "Bottom", size: '18px', color: '#00ff00ff' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 2000, color: '#00ff00', size: 1.2, axon_effect: 'hide' }
		]
	},
	{
		id: 2, 
		x: 2, 
		y: 11, 
		z: 15, 
		visible: false,
		label: { visible: true, text: "Right", size: '18px', color: '#ffff00ff' },
		signals: [
			{ visible: true, position: { x: 88, y: 88, z: 88 }, interval: 1000, color: '#ffff00', size: 1.3, axon_effect: 'show' },
		]
	},
	{
		id: 3, 
		x: 22, 
		y: 11, 
		z: 15, 
		visible: false,
		label: { visible: true, text: "Left", size: '18px', color: '#00ffffee' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 5000, color: '#ddff22', size: 1, axon_effect: 'hide' }
		]
	},
	{
		id: 4, 
		x: 12, 
		y: 11, 
		z: 0, 
		visible: false,
		label: { visible: true, text: "Back", size: '18px', color: '#ffffffee' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 3500, color: '#00ffff', size: 1, axon_effect: 'show' }
		]
	},
	{
		id: 5, 
		x: 12, 
		y: 11, 
		z: 28, 
		visible: false,
		label: { visible: true, text: "Front", size: '18px', color: '#ffffffee' },
		signals: [
			{ visible: true, position: { x: 10, y: 22, z: 10 }, interval: 3500, color: '#00ffff', size: 1, axon_effect: 'show' }
		]
	}

]