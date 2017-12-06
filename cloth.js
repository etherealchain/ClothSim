if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var container, stats;
var camera, scene, renderer;
var clothGeometry;
var clothMesh;
var mousePos = new THREE.Vector2();
var raycast = new THREE.Raycaster();
var nearPlane = 1;
var farPlane = 10000;
var groundMesh;

window.addEventListener('touchstart', touchStart, false);
window.addEventListener('touchmove', touchMove, false);
window.addEventListener('touchend', touchEnd, false);
window.addEventListener("mousedown", onMouseDown, false);
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("mouseup", onMouseUp, false);

init();
animate();

function onMouseDown(event ){
    getCloth = true;
}
function touchStart(event){
    event.preventDefault();
    getCloth = true;
}
function setGrabPoint(pointX, pointY){
    let mousePoint = new THREE.Vector3((pointX / window.innerWidth ) * 2 - 1, -( pointY / window.innerHeight ) * 2 + 1, 0.5).unproject( camera );
    let unitDirection = mousePoint.sub( camera.position ).normalize();
    let targetZ = 0;
    let ratio = (targetZ - camera.position.z )/ unitDirection.z;
    grabClothPoint = camera.position.clone().add(unitDirection.multiplyScalar(ratio));
}
function onMouseMove(event ){
    if(getCloth){
        setGrabPoint(event.clientX, event.clientY);
    }
}
function touchMove(event){
    event.preventDefault();
    if(getCloth){
        setGrabPoint(event.touches[0].pageX, event.touches[0].pageY);
    }
}
function onMouseUp(event ){
    getCloth = false;
}
function touchEnd(event){
    event.preventDefault();
    getCloth = false;
}
function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcce0ff );
    scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );
    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, nearPlane, farPlane );
    camera.position.set( 0, 50, 1500 );
    // get camera frustum
    frustum = new THREE.Frustum();
    frustum.setFromMatrix( new THREE.Matrix4().multiply( camera.projectionMatrix, camera.matrixWorldInverse ) );

    // lights
    var light, materials;
    scene.add( new THREE.AmbientLight( 0x666666 ) );
    light = new THREE.DirectionalLight( 0xdfebff, 1 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    var d = 300;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.far = 1000;
    scene.add( light );

    // cloth material
    var clothMaterial = new THREE.MeshLambertMaterial( {
        side: THREE.DoubleSide,
        alphaTest: 0.5
    } );
    // cloth geometry
    clothGeometry = new THREE.ParametricGeometry( clothFunction, cloth.w, cloth.h );
    // cloth mesh
    clothMesh = new THREE.Mesh( clothGeometry, clothMaterial );
    clothMesh.position.set( 0, 0, 0 );
    clothMesh.castShadow = true;
    scene.add( clothMesh );
    clothMesh.customDepthMaterial = new THREE.MeshDepthMaterial( {
        depthPacking: THREE.RGBADepthPacking,
        alphaTest: 0.5
    } );
   
    var groundMaterial = new THREE.MeshLambertMaterial({color:0x000000});
    groundMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
    groundMesh.position.y = groundPosition;
    groundMesh.rotation.x = - Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add( groundMesh );
    
    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.renderSingleSided = false;
    container.appendChild( renderer.domElement );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    // performance monitor
    stats = new Stats();
    container.appendChild( stats.dom );
    //
    window.addEventListener( 'resize', onWindowResize, false );
}
//
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
//
function animate() {
    requestAnimationFrame( animate );
    var time = Date.now();
    var windStrength = Math.cos( time / 7000 ) * 20 + 40;
    windForce.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ) )
    windForce.normalize()
    windForce.multiplyScalar( windStrength );

    simulate( time );
    render();
    stats.update();
}
function render() {
    var p = cloth.particles;
    for ( var i = 0, il = p.length; i < il; i ++ ) {
        clothGeometry.vertices[ i ].copy( p[ i ].position );
    }
    clothGeometry.verticesNeedUpdate = true;
    clothGeometry.computeFaceNormals();
    clothGeometry.computeVertexNormals();
    renderer.render( scene, camera );
}