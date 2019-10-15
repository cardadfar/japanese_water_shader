class Mesh {

    constructor(scene, params, origin, color) {
        /* origin - origin vector
         * points - reference to point cloud object
         * mesh - reference to triangle mesh object
         * helper - reference to vertex normals object
         */

        this.origin = origin

        var geometry = new THREE.PlaneBufferGeometry( params.scaleX * params.numX, params.scaleY * params.numY, params.numX, params.numY );
        
        function vertexShader() {
            return `
              varying vec3 vUv; 
              varying vec3 vUv_camera;
              varying vec2 xy;
              varying vec4 modelViewPosition; 
              varying vec3 viewNormal;
              varying vec3 absNormal;
          
              void main() {
                xy = uv;
                vUv = position; 
                vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                absNormal = normal;
                viewNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
                vec4 cameraResult = projectionMatrix * modelViewPosition; 
                vUv_camera = cameraResult.xyz;
                gl_Position = cameraResult; 
              }
            `
          }
          
          function fragmentShader() {
            return `
                uniform vec3 colorA; 
                uniform vec3 colorB; 
                uniform vec3 colorC; 
                uniform vec3 colorD; 
                uniform vec3 colorBlack; 

                varying vec3 vUv;
                varying vec3 vUv_camera;
                varying vec2 xy;

                varying vec3 viewNormal;
                varying vec3 absNormal;

                uniform sampler2D curvature;
                uniform sampler2D gradient;
                uniform sampler2D rifts;
          
                void main() {

                    float newX = 0.99 * (xy.x - 0.5) + 0.5;
                    float newY = -1.0 * xy.y + 1.0;
                    vec2 newXY = vec2(newX, newY);
                    vec4 curve = texture2D(curvature, newXY);
                    vec4 gradX  = texture2D(gradient, newXY);
                    vec4 rift;

                    if(gradX.x > 0.2) {
                        float newY_r = newY + 2.0*newX;
                        if (newY_r > 1.0) { newY_r =  newY_r - floor(newY_r); }
                        if (newY_r < 0.0) { newY_r = -newY_r - floor(-newY_r); }
                        vec2 riftXY = vec2(newX, newY_r);
                        rift  = texture2D(rifts, riftXY);
                    }

                    else if(gradX.y > 0.2) {
                        float newY_r = newY - 2.0*newX;
                        if (newY_r > 1.0) { newY_r =  newY_r - floor(newY_r); }
                        if (newY_r < 0.0) { newY_r = -newY_r - floor(-newY_r); }
                        vec2 riftXY = vec2(newX, newY_r);
                        rift  = texture2D(rifts, riftXY);
                    }


                    vec3 color;

                    if( vUv.z > 8.0 )
                        color = colorB;
                    else if( vUv.z > 4.0 )
                        color = colorC;
                    else 
                        color = colorD;

                    

                    if( absNormal.z > 0.9 && vUv.z > 15.0 )
                        color = colorA;

                    float thres = 0.1;
                    if( gradX.x < thres && gradX.y <thres && vUv.z > 15.0 )
                        color = colorA;

                    if( vUv_camera.z > 650.0 )
                        color = 0.5*color + 0.5*colorBlack;
                    else if( vUv_camera.z > 550.0 )
                        color = 0.6*color + 0.4*colorBlack;
                    else if( vUv_camera.z > 450.0 )
                        color = 0.7*color + 0.3*colorBlack;
                    else if( vUv_camera.z > 350.0 )
                        color = 0.8*color + 0.2*colorBlack;
                    else if( vUv_camera.z > 250.0 )
                        color = 0.9*color + 0.1*colorBlack;

                    gl_FragColor = vec4(color, 1.0);
                }
            `
          }

        var wth = params.numX + 1;
        var hgt = params.numY + 1;
        var curvature = new Uint8Array( 3 * wth * hgt );
        var gradient  = new Uint8Array( 3 * wth * hgt );
        var rifts  = new Uint8Array( 3 * wth * hgt );

        var curvatureTexture = new THREE.DataTexture(curvature, wth, hgt, THREE.RGBFormat);
        var gradientTexture  = new THREE.DataTexture(gradient , wth, hgt, THREE.RGBFormat);
        var riftTexture  = new THREE.DataTexture(rifts, wth, hgt, THREE.RGBFormat);

        for(var j = 0; j < hgt; j+=3) {
            for(var i = 0; i < wth; i++) {
                rifts[ 3*(j*wth + i) + 0 ] = 255;
                rifts[ 3*(j*wth + i) + 1 ] = 255;
                rifts[ 3*(j*wth + i) + 2 ] = 255;
            }
        }

        curvatureTexture.magFilter = THREE.LinearFilter;
        gradientTexture.magFilter = THREE.LinearFilter;
        riftTexture.magFilter = THREE.LinearFilter;

        curvatureTexture.needsUpdate = true;
        gradientTexture.needsUpdate = true;
        riftTexture.needsUpdate = true;


        var uniforms = {}
        uniforms.colorA     = {type: 'vec3', value: new THREE.Color(0xffffff)}
        uniforms.colorB     = {type: 'vec3', value: new THREE.Color(0xacdbf7)}
        uniforms.colorC     = {type: 'vec3', value: new THREE.Color(0x0095c6)}
        uniforms.colorD     = {type: 'vec3', value: new THREE.Color(0x132893)}
        uniforms.colorBlack = {type: 'vec3', value: new THREE.Color(0x264669)}

        uniforms.curvature  = {type: 't', value: curvatureTexture }
        uniforms.gradient  = {type: 't', value: gradientTexture }
        uniforms.rifts  = {type: 't', value: riftTexture }
        
        var material =  new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader(),
            vertexShader: vertexShader(),
            side: THREE.DoubleSide,
            smoothShading: true,
          })


        //var planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

        this.mesh = new THREE.Mesh( geometry, material );
        this.mesh.rotation.x = -Math.PI / 2;

        var positions = this.mesh.geometry.attributes.position.array
        this.old_positions = positions.slice()

        this.helper = new THREE.VertexNormalsHelper( this.mesh , 2, 0xff0000, 1 );
        scene.add( this.mesh );
        scene.add( this.helper ); 
        this.helper.visible = params.normals;

    }

    updateMaterial(params) {
        this.mesh.material.wireframe = params.wireframe;
        this.helper.visible = params.normals;
    }

    updateMesh(params, burst) {



        var positions = this.mesh.geometry.attributes.position.array
        var new_positions = positions.slice();

        
        for(var i = 0; i < burst.length; i++) {
            var mag = burst[i].mag;
            var loc = burst[i].loc;
            var dir = burst[i].dir;
            var perp = new THREE.Vector3(-dir.z, 0, dir.x)
            
            var x = Math.floor( (loc.x + params.numX * params.scaleX / 2) / params.scaleX)
            var y = Math.floor( (loc.z + params.numY * params.scaleY / 2) / params.scaleY)
            var sx = params.numX + 1
            var sy = params.numY + 1

            
            var span = 0.02
            for(var t2 = -span; t2 < span; t2 += span/5) {
                for(var t = 0; t < 1; t += 0.01) {
                    var dx = Math.round( x + dir.x * t + perp.x * t2);
                    var dy = Math.round( y + dir.z * t + perp.z * t2 );

                    
                    if(params.sumWaves) {

                        var hgt_scale = (-15*(t-0.5)*(t-0.5)+10)/300
                        
                        if ((dx >= 0 && dx < sx) && (dy >= 0 && dy < sy))
                            new_positions[3 * (dy * sx + dx) + 2] += mag * params.scaleZ * hgt_scale;
                    
                    }

                    else {

                        var hgt_scale = (-15*(t-0.5)*(t-0.5)+10)/10
                        
                        if ((dx >= 0 && dx < sx) && (dy >= 0 && dy < sy))
                            new_positions[3 * (dy * sx + dx) + 2] = mag * params.scaleZ * hgt_scale;

                    }

                }
            }

            
            
            
        } 

        
        for(var i = 2; i < new_positions.length; i+=3) {
    
            var x = ((i - 2)/3) % (params.numX + 1)
            var y = (((i - 2)/3) - x) / (params.numX + 1)

            if(params.laplacian)
                var z = this.laplacianHeight(x, y, new_positions, params)
            else
                var z = this.convolutionHeight(x, y, new_positions, params)

            new_positions[i] = z * 0.97 + 0.03 * this.origin.z
            
        } 

        
        

        this.mesh.geometry.attributes.position.array = new_positions;
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.computeFaceNormals();
        this.mesh.geometry.computeVertexNormals();
        this.helper.update();

        this.old_positions = positions

        this.updateCurvature(params, new_positions);

    }


    updateScale(params) {

        var positions_points = []
        var numX = params.numX
        var numY = params.numY
        var scaleX = params.scaleX
        var scaleY = params.scaleY
        
        for ( var i = 0; i <= numY; i ++ ) {
            for ( var j = 0; j <= numX; j ++ ) {
                var x = j * scaleX - (numX/2 * scaleX) + this.origin.x;
                var y = this.origin.y;
                var z = i * scaleY - (numY/2 * scaleY) + this.origin.z;
                positions_points.push( x, y, z );
            }
        }

        this.points.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions_points, 3 ) );
        this.points.geometry.attributes.position.needsUpdate = true;
    }


    updateCurvature(params, positions) {

        var curvatureTexture = this.mesh.material.uniforms.curvature.value;
        var gradientTexture  = this.mesh.material.uniforms.gradient.value;

        var wth = params.numX + 1;
        var hgt = params.numY + 1;
        var curvature = curvatureTexture.image.data
        var gradient  = gradientTexture.image.data

        
        for (var y = 0; y < hgt; y++) {
            for (var x = 0; x < wth; x++) {

                
                var dz_dx = ( positions[ 3*(y*wth + (x+1)) + 2 ] - positions[ 3*(y*wth + (x-1)) + 2 ] ) / (2 * params.scaleX)
                var dz2_dx2 = ( positions[ 3*(y*wth + (x-1)) + 2 ] - 2*positions[ 3*(y*wth + (x)) + 2 ] + positions[ 3*(y*wth + (x+1)) + 2 ] ) / (2 * params.scaleX)
                var cz_dx = dz2_dx2 / (Math.pow( (1 + (dz_dx*dz_dx)), 1.5 ))

                var dz_dy = (positions[ 3*((y+1)*wth + x) + 2 ] - positions[ 3*((y-1)*wth + x) + 2 ] ) / (2 * params.scaleX)
                var dz2_dy2 = (positions[ 3*((y-1)*wth + x) + 2 ] - 2*positions[ 3*((y)*wth + x) + 2 ] + positions[ 3*((y+1)*wth + x) + 2 ] ) / (2 * params.scaleX)
                var cz_dy = dz2_dy2 / (Math.pow( (1 + (dz_dy*dz_dy)), 1.5 ))

                var cz = Math.sqrt(cz_dx*cz_dx + cz_dy*cz_dy)


                if ( cz < 0   ) { cz = 0;   }
                if ( cz > 255 ) { cz = 255; }


                curvature[ 3*(y*wth + x)     ] = cz_dx;
                curvature[ 3*(y*wth + x) + 1 ] = cz_dy;
                curvature[ 3*(y*wth + x) + 2 ] = cz;

                
                gradient[ 3*(y*wth + x)     ] = dz_dx;
                gradient[ 3*(y*wth + x) + 1 ] = -dz_dx;
                //gradient[ 3*(y*wth + x) + 2 ] = Math.floor(Math.atan2(dz_dy, dz_dx));

            }
        }

        curvatureTexture.needsUpdate = true;
        gradientTexture.needsUpdate  = true;

        this.mesh.material.uniforms.curvature.value = curvatureTexture;
        this.mesh.material.uniforms.gradient.value  = gradientTexture;

    }



    


    laplacianHeight(x, y, positions, params) {


        var sx = params.numX + 1
    
        var sum = 0;

        var left = 0
        var right = 0
        var top = 0
        var bottom = 0
        var prev = this.old_positions[3*(y*sx + x) + 2]
        var curr = positions[3*(y*sx + x) + 2]


        if(x > 0)           { left   = positions[3*(y*sx + (x-1)) + 2] }
        if(x < params.numX) { right  = positions[3*(y*sx + (x+1)) + 2] }
        if(y > 0)           { bottom = positions[3*((y-1)*sx + x) + 2] }
        if(y < params.numY) { top    = positions[3*((y+1)*sx + x) + 2] }

        
        sum = 2 * curr - prev + 0.2*Math.trunc((left + right + top + bottom - 4 * curr) / 4)
        sum = 0.3 * sum + 0.7 * curr
        return sum
        
    
    }

    convolutionHeight(x, y, positions, params) {


        var sx = params.numX + 1
        var scale = 1
        var mask = [[1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 200, 1, 1],
                    [1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1]]
        var maskSum = 0;
        var sum = 0;
        var scale = Math.floor(mask.length / 2)

        for(var b = 0; b < mask.length; b++) {
            for(var a = 0; a < mask[0].length; a++) {
                maskSum += mask[b][a]
            }
        }

        for(var dy = -scale; dy <= scale; dy++) {
            for(var dx = -scale; dx <= scale; dx++) {
                if ((y+dy < 0) || (y+dy > params.numY) || (x+dx < 0) || (x+dx > params.numX))
                    sum += this.origin.z
                else
                    sum += positions[3*((y+dy)*sx + (x+dx)) + 2] * mask[dy+scale][dx+scale]
            }
        }
    
        return sum / (maskSum) 
        
    
    }
}





