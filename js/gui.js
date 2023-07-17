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

  gui_settings = gui.addFolder("Settings");
  // gui_settings.add( neuralNet.settings, 'currentMaxSignals', 0, neuralNet.settings.limitSignals ).name( 'Max Signals' );
  gui_settings.add(neuralNet, "neuronSizeMultiplier", 0, 2).name("Neuron Size");
  gui_settings.add(neuralNet, "neuronOpacity", 0, 1.0).name("Neuron Opacity");
  gui_settings.addColor(neuralNet, "neuronColor").name("Neuron Color");
  gui_settings
    .add(neuralNet, "axonOpacityMultiplier", 0.0, 5.0)
    .name("Axon Opacity");
  gui_settings.addColor(neuralNet, "axonColor").name("Axon Color");
  gui_settings.addColor(sceneSettings, "bgColor").name("Background");

  // gui_info.open();
  gui_settings.open();

  for (var i = 0; i < gui_settings.__controllers.length; i++) {
    console.log(
      "adding controller" +
        i +
        " to gui_settings, with name " +
        gui_settings.__controllers[i].property
    );
    gui_settings.__controllers[i].onChange(updateNeuralNetworkSettings);
  }
}

function updateNeuralNetworkSettings() {
  console.log("updateNeuralNetworkSettings");
  if (removeBackgroundScene)
    renderer.domElement.style.background =
      "#" + sceneSettings.bgColor.toString(16);
  neuralNet.updateSettings();
  // if ( neuralNet.settings.signalMinSpeed > neuralNet.settings.signalMaxSpeed ) {
  // 	neuralNet.settings.signalMaxSpeed = neuralNet.settings.signalMinSpeed;
  // 	gui_settings.__controllers[ 3 ].updateDisplay();
  // }
}

function updateGuiInfo() {
  // for ( var i = 0; i < gui_info.__controllers.length; i++ ) {
  // 	gui_info.__controllers[ i ].updateDisplay();
  // }
}
