var BOX_HEIGHT = 4.0;
var BOX_SIDE_WIDTH = 0.5;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var boxMaterial = new THREE.MeshPhongMaterial( { color: 0xaaaacc } );
var ground = new THREE.PlaneGeometry( 10, 10, 1, 1 );
ground.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
var groundMesh = new THREE.Mesh(ground, boxMaterial);			
scene.add(groundMesh);

var sideLeft = new THREE.CubeGeometry(BOX_SIDE_WIDTH, BOX_HEIGHT, 10);
var sideLeftMesh = new THREE.Mesh(sideLeft, boxMaterial);
sideLeftMesh.translateX(-5.25);
scene.add(sideLeftMesh);
var r = new THREE.Mesh(sideLeft, boxMaterial);
r.translateX(5.25);
scene.add(r);
var sideBack = new THREE.CubeGeometry(10 + 2 * BOX_SIDE_WIDTH, BOX_HEIGHT, BOX_SIDE_WIDTH);
var r2 = new THREE.Mesh(sideBack, boxMaterial);						
r2.translateZ(-5.25);
scene.add(r2);
var r3 = new THREE.Mesh(sideBack, boxMaterial);						
r3.translateZ(5.25);
scene.add(r3);

var quality = 50
var plane = new THREE.PlaneGeometry( 10, 10, quality - 1, quality - 1 );
plane.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );			

var waterMat = new THREE.MeshPhongMaterial( { opacity: 0.3, transparent: true, color: 0x0000ff, specular: 0xffffff } );			
var waterMesh = new THREE.Mesh(plane, waterMat);
waterMesh.receiveShadow = true;
waterMesh.castShadow = true;
scene.add(waterMesh);
	
// Lights

scene.add( new THREE.AmbientLight( 0x333333 ) );

var light = new THREE.PointLight( 0xffffff);
light.position.set( 2, 6, -1 );
scene.add( light );

var light2 = new THREE.PointLight( 0xffffff, 0.1);
light2.position.set( -30, 150, 100 );
scene.add( light2 );
		

camera.position.x = 0.0;
camera.position.y = 10;
camera.position.z = 8;
camera.lookAt( scene.position );
			
// Initialize height and velocity fields
var u = [];
var v = [];
for(var i=0; i < quality; i++) {
	u[i] = [];
	v[i] = [];
	for(var j=0; j < quality; j++) {		
		u[i][j] = 0.5;
		v[i][j] = 0;
	}
}

function clamp(x) {
	if (x < 0) return 0;
	if (x >= quality) return quality - 1;
	return x;
}

setInterval(function () {						
	var x = ~~(Math.random() * (quality-1));
	var y = ~~(Math.random() * (quality-1));
	
	for(var i=0; i < quality; i++) {				
		for(var j=0; j < quality; j++) {
			var dx = i - x;
			var dy = j - y;
			var d = dx * dx + dy * dy;
			u[i][j] += 1.5 * Math.exp(-d / 2);
		}
	}				
}, 1000);

function render() {
	requestAnimationFrame(render);
	
	// Update velocities
	for(var i=0; i < quality; i++) {					
		for(var j=0; j < quality; j++) {
			v[i][j] += (   u[clamp(i-1)][j] 
						 + u[clamp(i+1)][j]
						 + u[i][clamp(j-1)]
						 + u[i][clamp(j+1)] ) / 4 - u[i][j];
			v[i][j] *= 0.99;						
		}
	}
	// Update heights
	for(var i=0; i < quality; i++) {					
		for(var j=0; j < quality; j++) {
			u[i][j] += v[i][j];
		}
	}	
	
	for ( var i = 0, l = plane.vertices.length; i < l; i ++ ) {
		var x = i % quality, y = ~~ ( i / quality );					
		plane.vertices[i].y = u[x][y];
	}
	
	plane.computeFaceNormals();
	plane.computeVertexNormals();

	plane.normalsNeedUpdate = true;
	plane.verticesNeedUpdate = true;						

	renderer.render(scene, camera);
}
render();