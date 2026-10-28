import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';
const host = document.querySelector('#scene');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35,1,.1,50);
camera.position.set(0,.65,7.7); camera.lookAt(0,0,0);
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true}); }
catch { document.querySelector('#error').hidden=false; document.querySelector('#error').textContent='Для 3D-предпросмотра включите аппаратное ускорение браузера.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
host.append(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer);
const room=new RoomEnvironment(); const environment=pmrem.fromScene(room,.04);
scene.environment=environment.texture; room.dispose(); pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xc9e4ff,0x28384f,2));
for(const [x,y,z,power] of [[-3,4,4,28],[4,2,-2,36]]){const l=new THREE.PointLight(0xd4e7ff,power);l.position.set(x,y,z);scene.add(l);}
const coin=new THREE.Group();scene.add(coin);
const glass=new THREE.MeshPhysicalMaterial({color:0xe5f0ff,metalness:0,roughness:.065,transmission:1,thickness:.32,ior:1.46,clearcoat:1,envMapIntensity:1.2,transparent:true,opacity:.38,depthWrite:false});
const shape=new THREE.Shape();shape.absarc(0,0,1.16,0,Math.PI*2,false);
const bodyGeo=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSegments:6,steps:1,bevelSize:.075,bevelThickness:.075,curveSegments:128});bodyGeo.translate(0,0,-.11);
coin.add(new THREE.Mesh(bodyGeo,glass));
const rimMat=new THREE.MeshPhysicalMaterial({color:0xf2f7ff,metalness:0,roughness:.09,transmission:1,thickness:.1,ior:1.46,clearcoat:.35,envMapIntensity:.65,transparent:true,opacity:.28,depthWrite:false});
for(const z of [-.16,.16]){const rim=new THREE.Mesh(new THREE.TorusGeometry(1.15,.045,16,160),rimMat);rim.position.z=z;coin.add(rim);const inner=new THREE.Mesh(new THREE.TorusGeometry(1.025,.009,8,128),rimMat);inner.position.z=z+.002*Math.sign(z);coin.add(inner);}
// Raised, bevelled glass relief, embedded into each face of the coin.
// Both symbols are actual geometry: their edges catch the environment light.
function rubleRelief() {
  const s = new THREE.Shape();
  s.moveTo(-.29,-.49); s.lineTo(-.29,-.29); s.lineTo(-.41,-.29);
  s.lineTo(-.41,-.17); s.lineTo(-.29,-.17); s.lineTo(-.29,-.04);
  s.lineTo(-.41,-.04); s.lineTo(-.41,.09); s.lineTo(-.29,.09);
  s.lineTo(-.29,.49); s.lineTo(.065,.49);
  s.bezierCurveTo(.48,.49,.48,-.04,.065,-.04);
  s.lineTo(-.14,-.04); s.lineTo(-.14,-.17); s.lineTo(.19,-.17);
  s.lineTo(.19,-.29); s.lineTo(-.14,-.29); s.lineTo(-.14,-.49); s.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-.14,.36); hole.lineTo(-.14,.09); hole.lineTo(.06,.09);
  hole.bezierCurveTo(.28,.09,.28,.36,.06,.36); hole.closePath();
  s.holes.push(hole); return [s];
}
function dollarRelief() {
  const s = new THREE.Shape();
  s.moveTo(.31,.34);
  s.bezierCurveTo(.23,.44,.13,.48,.055,.48);
  s.lineTo(.055,.59); s.lineTo(-.055,.59); s.lineTo(-.055,.48);
  s.bezierCurveTo(-.4,.45,-.43,.11,-.14,-.01);
  s.lineTo(.12,-.12);
  s.bezierCurveTo(.33,-.21,.12,-.47,-.23,-.24);
  s.lineTo(-.33,-.35);
  s.bezierCurveTo(-.24,-.44,-.14,-.48,-.055,-.49);
  s.lineTo(-.055,-.59); s.lineTo(.055,-.59); s.lineTo(.055,-.49);
  s.bezierCurveTo(.44,-.45,.46,-.1,.17,.025);
  s.lineTo(-.1,.14);
  s.bezierCurveTo(-.31,.23,-.09,.46,.22,.23);
  s.closePath(); return [s];
}
const reliefGlass = glass.clone();
reliefGlass.opacity = .94;
reliefGlass.thickness = .13;
reliefGlass.roughness = .075;
reliefGlass.envMapIntensity = 1.65;
const reliefs = [];
for (const [shapes, direction] of [[rubleRelief(), 1], [dollarRelief(), -1]]) {
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: .065, bevelEnabled: true, bevelSegments: 5,
    bevelSize: .024, bevelThickness: .024, curveSegments: 32, steps: 1,
  });
  const relief = new THREE.Mesh(geometry, reliefGlass);
  relief.position.z = direction * .17;
  relief.rotation.y = direction === 1 ? 0 : Math.PI;
  relief.renderOrder = 3;
  coin.add(relief);
  reliefs.push({ mesh: relief, direction });
}
// A closed liquid volume is rebuilt inside the circular cavity. Its upper
// boundary is a wave in local X; rotation about Y keeps gravity vertical.
const liquidGeo=new THREE.BufferGeometry();
// PLATIVEZDE CTA fills: light 3:44346 (#1473E6), dark 100:12632 (#579CFF).
const liquidColors = Object.freeze({ light: 0x1473e6, dark: 0x579cff });
const liquidMat=new THREE.MeshPhysicalMaterial({color:liquidColors.dark,metalness:0,roughness:.16,clearcoat:.6,transmission:.08,thickness:.35,ior:1.333,side:THREE.DoubleSide,envMapIntensity:.45});
// Keep the CTA base colour stable under studio lights; retain subtle 3D shading.
liquidMat.toneMapped = false;
liquidMat.onBeforeCompile = shader => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <opaque_fragment>',
    'outgoingLight = mix(diffuseColor.rgb, outgoingLight, 0.1);\n#include <opaque_fragment>'
  );
};
const liquid=new THREE.Mesh(liquidGeo,liquidMat);coin.add(liquid);
const N=160,R=1.065,D=.115;
const positions=new Float32Array(N*72);liquidGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
// A thin translucent meniscus follows the rolling surface on both faces.
const crestGeo=new THREE.BufferGeometry();
const crestPositions=new Float32Array(N*36);
crestGeo.setAttribute('position',new THREE.BufferAttribute(crestPositions,3));
const crestMaterial=new THREE.MeshBasicMaterial({color:0x9eafc2,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
const crest=new THREE.Mesh(crestGeo,crestMaterial);crest.renderOrder=2;coin.add(crest);
function waterSurface(x,z,level,t) {
  const envelope=THREE.MathUtils.smoothstep(R-Math.abs(level),0,.2);
  const phase=t*Math.PI/6;
  // All frequencies close after 12 seconds; front/back waves have a small lag.
  const broad=.052*Math.sin(x*3.8-phase*4+z*2.5);
  const ripple=.019*Math.sin(x*8.2+phase*6-z*3);
  const fine=.007*Math.sin(x*16-phase*10+z*5);
  const sway=.022*x*Math.sin(phase*2);
  return level+envelope*(broad+ripple+fine+sway);
}
// Small air bubbles rise through the cavity, sharing the animation clock.
const bubbleGeometry = new THREE.SphereGeometry(1, 16, 12);
const bubbles = Array.from({length: 22}, (_, i) => {
  const radius = .014 + ((i * 7) % 11) * .0023;
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xd6e6f8, metalness: .12, roughness: .08,
    transmission: .25, thickness: .035, ior: 1.1,
    clearcoat: 1, envMapIntensity: 1.4,
    transparent: true, opacity: .3, depthWrite: false, depthTest: false,
  });
  const mesh = new THREE.Mesh(bubbleGeometry, material);
  mesh.renderOrder = 2;
  coin.add(mesh);
  return {mesh, radius, x: -.86 + ((i * 13) % 23) / 22 * 1.72,
    phase: ((i * 17) % 29) / 29, speed: .12 + (i % 5) * .018};
});
function updateBubbles(level, t) {
  for (const [i, bubble] of bubbles.entries()) {
    const {mesh, radius}=bubble;
    const x=bubble.x+.018*Math.sin(t*1.8+i);
    const extent=Math.sqrt(Math.max(0,R*R-x*x));
    const bottom=-extent;
    const z=((i%3)-1)*.065;
    const surface=Math.min(extent,waterSurface(x-radius,z,level,t),waterSurface(x+radius,z,level,t));
    const y=bottom+((t*bubble.speed+bubble.phase)%(2*R));
    const clearance=Math.min(y-bottom,surface-y)-radius;
    const fade=THREE.MathUtils.clamp(clearance/.08,0,1);
    mesh.visible=fade>0;
    if (!mesh.visible) continue;
    mesh.position.set(x,y,((i%3)-1)*.065);
    mesh.scale.setScalar(radius*(.65+.35*fade));
    mesh.material.opacity=.3*fade;
  }
}
function water(level,t) {
  let k=0,c=0;
  const add=(x,y,z)=>{positions[k++]=x;positions[k++]=y;positions[k++]=z;};
  const tri=(a,b,c)=>{add(...a);add(...b);add(...c);};
  const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
  const crestQuad=(a,b,d,e)=>{for(const v of [a,b,d,a,d,e])for(const n of v)crestPositions[c++]=n;};
  const extent=x=>Math.sqrt(Math.max(0,R*R-x*x));
  const top=(x,z)=>THREE.MathUtils.clamp(waterSurface(x,z,level,t),-extent(x),extent(x));
  const depth=x=>Math.max(waterSurface(x,D,level,t),waterSurface(x,-D,level,t))+extent(x);
  for(let i=0;i<N;i++) {
    let x1=-R+2*R*i/N,x2=-R+2*R*(i+1)/N;
    const wet1=depth(x1)>0,wet2=depth(x2)>0;
    if(!wet1&&!wet2) continue;
    if(wet1!==wet2) {
      let dry=wet1?x2:x1,wet=wet1?x1:x2;
      for(let j=0;j<16;j++){const mid=(dry+wet)/2;if(depth(mid)>0)wet=mid;else dry=mid;}
      if(wet1)x2=(dry+wet)/2;else x1=(dry+wet)/2;
    }
    const b1=-extent(x1),b2=-extent(x2);
    const f1=top(x1,D),f2=top(x2,D),r1=top(x1,-D),r2=top(x2,-D);
    quad([x1,b1,D],[x2,b2,D],[x2,f2,D],[x1,f1,D]);
    quad([x2,b2,-D],[x1,b1,-D],[x1,r1,-D],[x2,r2,-D]);
    quad([x1,f1,D],[x2,f2,D],[x2,r2,-D],[x1,r1,-D]);
    quad([x2,b2,D],[x1,b1,D],[x1,b1,-D],[x2,b2,-D]);
    for(const z of [-D,D]) {
      const y1=top(x1,z),y2=top(x2,z);
      // Hide the meniscus against the ceiling or on dry sections.
      if(y1<=b1+.001&&y2<=b2+.001)continue;
      if(waterSurface(x1,z,level,t)>=extent(x1)&&waterSurface(x2,z,level,t)>=extent(x2))continue;
      const band=x=>.025+.014*(.5+.5*Math.sin(x*6+t*Math.PI));
      const face=z+Math.sign(z)*.002;
      crestQuad([x1,Math.max(b1,y1-band(x1)),face],[x2,Math.max(b2,y2-band(x2)),face],[x2,y2,face],[x1,y1,face]);
    }
  }
  liquidGeo.setDrawRange(0,k/3);liquid.visible=k>0;
  liquidGeo.attributes.position.needsUpdate=true;
  liquidGeo.computeVertexNormals();liquidGeo.computeBoundingSphere();
  crestGeo.setDrawRange(0,c/3);crest.visible=c>0;
  crestGeo.attributes.position.needsUpdate=true;crestGeo.computeBoundingSphere();
}
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,speed=1,last=performance.now();
function setTheme(light) {
  document.body.classList.toggle('light',light);
  liquidMat.color.set(light ? liquidColors.light : liquidColors.dark);
  crestMaterial.color.set(light ? 0x9bd8ff : 0xc1e1ff);
  document.querySelector('#theme').textContent=light?'Тёмный фон':'Светлый фон';
}
setTheme(document.body.classList.contains('light'));
document.querySelector('#theme').onclick=()=>setTheme(!document.body.classList.contains('light'));
new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=width<500?9.5:7.7;camera.updateProjectionMatrix();}).observe(host);
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!paused&&!document.hidden)time+=dt*speed;const cycle=time%12;const fill=(1-Math.cos(cycle/12*Math.PI*2))/2;coin.rotation.y=time*Math.PI/3;for(const {mesh,direction} of reliefs) mesh.visible=direction*Math.cos(coin.rotation.y)>0;water(-R+2*R*fill,time);updateBubbles(-R+2*R*fill,time);renderer.render(scene,camera);}
requestAnimationFrame(frame);







