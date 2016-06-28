// ViewObjModel.js

import alfrid from 'alfrid';
let GL = alfrid.GL;
const vs = require('../shaders/pbr.vert');
const fs = require('../shaders/pbr.frag');

class ViewObjModel extends alfrid.View {
	
	constructor() {
		super(vs, fs);
		this.time = Math.random() * 0xFF;
	}


	_init() {
		let strObj = getAsset('objHead');
		this.mesh = alfrid.ObjLoader.parse(strObj);

		console.log(this.mesh);

		this.roughness = .97;
		this.specular = 0;
		this.metallic = 0;
		const grey = 0.015;
		this.baseColor = [grey, grey, grey];
	}


	render(textureRad, textureIrr, textureAO, textureBrush, drawingMatrix) {
		this.time += 0.01;
		this.shader.bind();

		this.shader.uniform('uAoMap', 'uniform1i', 0);
		this.shader.uniform("uTextureBrush", "uniform1i", 1);
		this.shader.uniform('uRadianceMap', 'uniform1i', 2);
		this.shader.uniform('uIrradianceMap', 'uniform1i', 3);
		textureAO.bind(0);
		textureBrush.bind(1);
		textureRad.bind(2);
		textureIrr.bind(3);

		this.shader.uniform("uDrawingMatrix", "uniformMatrix4fv", drawingMatrix);
		this.shader.uniform('uBaseColor', 'uniform3fv', this.baseColor);
		this.shader.uniform('uRoughness', 'uniform1f', this.roughness);
		this.shader.uniform('uMetallic', 'uniform1f', this.metallic);
		this.shader.uniform('uSpecular', 'uniform1f', this.specular);

		this.shader.uniform('uExposure', 'uniform1f', params.exposure);
		this.shader.uniform('uGamma', 'uniform1f', params.gamma);
		this.shader.uniform("uTime", "float", this.time);

		GL.draw(this.mesh);
	}


}

export default ViewObjModel;