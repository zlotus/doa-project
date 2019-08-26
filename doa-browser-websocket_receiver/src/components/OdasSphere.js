import React, { Component } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// const energyIsInRange = (e) => {
//   return e >= rangeSlider.getValue()[0];
// };

const scaleEnergy = (e) => {

  // var min = rangeSlider.getValue()[0];
  // var max = rangeSlider.getValue()[1];

  let min = 0;
  let max = 1;

  // Rescale according to minimal value

  e -= min;
  max -= min;

  if (e > max)
    e = max;

  // Round energy between 0 and 10
  return Math.round((e / max) * 10);
};


const heatmapColors = [
  'rgb(16, 0, 229)',
  'rgb(64, 3, 229)',
  'rgb(111, 7, 230)',
  'rgb(156, 11, 230)',
  'rgb(200, 15, 231)',
  'rgb(232, 19, 220)',
  'rgb(232, 23, 180)',
  'rgb(233, 27, 141)',
  'rgb(233, 31, 103)',
  'rgb(234, 35, 67)',
  'rgb(235, 46, 40)',
];

let potSourceMaterial = [];

heatmapColors.forEach(function(color) {
  potSourceMaterial.push(new THREE.PointsMaterial({
    color: color,
    size: 0.1,
  }));
});

class OdasSphere extends Component {
  constructor(props) {
    super(props);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, props.width / props.height, 0.1, 1000);
    this.renderScene = this.renderScene.bind(this);

    this.potSources3D = [];

  }

  componentDidMount() {
    const { id, width, height } = this.props;

    const canvas = document.getElementById(`OdasSphere-${id}`);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    this.renderer.setClearColor(0xffffff);
    this.renderer.setSize(width, height);

    this.controls = new TrackballControls(this.camera, canvas);

    this.camera.position.z = 5;

    // Top
    const sphereUpGeometry = new THREE.SphereGeometry(1, 10, 10, 0, Math.PI, 0, Math.PI);
    const sphereUpMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const sphereTop = new THREE.Mesh(sphereUpGeometry, sphereUpMaterial);
    this.scene.add(sphereTop);

    // Bottom
    const sphereBottomGeometry = new THREE.SphereGeometry(1, 10, 10, Math.PI, Math.PI, 0, Math.PI);
    const sphereBottomMaterial = new THREE.MeshBasicMaterial({
      color: 0x8d4f1a,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const sphereBottom = new THREE.Mesh(sphereBottomGeometry, sphereBottomMaterial);
    this.scene.add(sphereBottom);

    // Ground
    const groundGeometry = new THREE.CircleGeometry(1, 10);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x328327, transparent: true, opacity: 0.5 });
    groundMaterial.side = THREE.DoubleSide;
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.scene.add(ground);

    // Cube
    const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.scene.add(cube);

    // Sources
    // const sourceGroup = new THREE.Group();
    //
    // const sourceGeometry = new THREE.SphereGeometry(0.08, 10, 10);
    // const rgbValueStrings = ['rgb(75,192,192)', 'rgb(192,75,192)', 'rgb(192,192,30)', 'rgb(0,200,40)'];
    // const sources3D = [];
    // rgbValueStrings.forEach(color => {
    //   let sourceMaterial = new THREE.MeshBasicMaterial({ color: color, wireframe: false });
    //   let source = new THREE.Mesh(sourceGeometry, sourceMaterial);
    //   source.visible = false;
    //   sources3D.push(source);
    //   sourceGroup.add(source);
    // });
    // this.scene.add(sourceGroup);


    // Potential sources
    this.potGroup = new THREE.Group();
    this.scene.add(this.potGroup);

    this.renderScene();
  }

  componentDidUpdate(prevProps) {
    // if (this.props.dataSource) {
    //   console.log(prevProps.dataSource);
    // }
    console.log(this.props.dataSource);

    // Remove old trail points
    if (this.potSources3D.length > 0) {
      this.potSources3D.forEach((src, i) => {
        src.life--;

        if (src.life < 1) {  // Dispose if life is over
          src.obj.material.dispose();
          src.obj.geometry.dispose();
          src.obj.parent.remove(src.obj);
          src.obj = null;
          this.potSources3D.splice(i, 1);
        }
      });
    }

    let tmp_potGroup = this.potGroup;
    let tmp_potSources3D = this.potSources3D;
    this.props.dataSource.localizationSources.forEach(function(s) {

      // if (energyIsInRange(s.e)) {    // Add source if source's energy's in range
      let geo = new THREE.Geometry();
      let ps = new THREE.Vector3(s.x, s.y, s.z);
      geo.vertices.push(ps);

      let sys = new THREE.Points(geo, potSourceMaterial[scaleEnergy(s.e)]);
      tmp_potSources3D.push({ obj: sys, life: 50 });
      tmp_potGroup.add(sys);
      // }
    });

    const { width, height } = this.props;
    if (width !== prevProps.width || height !== prevProps.height) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  renderScene(d) {
    requestAnimationFrame(this.renderScene);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  render() {
    const { id } = this.props;
    return (
      <canvas id={`OdasSphere-${id}`}/>
    );
  }
}

export default OdasSphere;

