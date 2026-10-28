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
const rimMat=new THREE.MeshPhysicalMaterial({color:0xc7e2ff,metalness:.5,roughness:.12,transmission:.35,thickness:.2,clearcoat:1});
for(const z of [-.16,.16]){const rim=new THREE.Mesh(new THREE.TorusGeometry(1.15,.045,16,160),rimMat);rim.position.z=z;coin.add(rim);const inner=new THREE.Mesh(new THREE.TorusGeometry(1.025,.009,8,128),rimMat);inner.position.z=z+.002*Math.sign(z);coin.add(inner);}
function symbolTexture(symbol){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 350px Arial';ctx.fillStyle='#e3efff';ctx.shadowColor='#6a9bcd';ctx.shadowBlur=6;ctx.fillText(symbol,256,277);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
for(const [symbol,z,rotation] of [['₽',.195,0],['$',-.195,Math.PI]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.32,1.32),new THREE.MeshStandardMaterial({map:symbolTexture(symbol),transparent:true,metalness:.65,roughness:.22,side:THREE.FrontSide,depthWrite:false}));m.position.z=z;m.rotation.y=rotation;m.renderOrder=3;coin.add(m);}
// A closed liquid volume is rebuilt inside the circular cavity. Its upper
// boundary is a wave in local X; rotation about Y keeps gravity vertical.
const liquidGeo=new THREE.BufferGeometry();
const liquidMat=new THREE.MeshPhysicalMaterial({color:0x5297ff,metalness:.15,roughness:.13,clearcoat:1,transmission:.18,thickness:.35,ior:1.333,side:THREE.DoubleSide,envMapIntensity:1.1});
const liquid=new THREE.Mesh(liquidGeo,liquidMat);coin.add(liquid);
const N=100,R=1.065,D=.115;
const positions=new Float32Array(N*72);liquidGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
function water(level,t){let k=0;const add=(x,y,z)=>{positions[k++]=x;positions[k++]=y;positions[k++]=z;};const tri=(a,b,c)=>{add(...a);add(...b);add(...c);};const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
for(let i=0;i<N;i++){const x1=-R+2*R*i/N,x2=-R+2*R*(i+1)/N;const b1=-Math.sqrt(Math.max(0,R*R-x1*x1)),b2=-Math.sqrt(Math.max(0,R*R-x2*x2));const top=x=>THREE.MathUtils.clamp(level+.022*Math.sin(x*7+t*2.4)+.012*Math.sin(x*12-t*3.2),-Math.sqrt(Math.max(0,R*R-x*x)),Math.sqrt(Math.max(0,R*R-x*x)));const y1=top(x1),y2=top(x2);
quad([x1,b1,D],[x2,b2,D],[x2,y2,D],[x1,y1,D]);quad([x2,b2,-D],[x1,b1,-D],[x1,y1,-D],[x2,y2,-D]);quad([x1,y1,D],[x2,y2,D],[x2,y2,-D],[x1,y1,-D]);quad([x2,b2,D],[x1,b1,D],[x1,b1,-D],[x2,b2,-D]);}
liquidGeo.attributes.position.needsUpdate=true;liquidGeo.computeVertexNormals();liquidGeo.computeBoundingSphere();}
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,speed=1,last=performance.now();
const pause=document.querySelector('#pause');function syncPause(){pause.textContent=paused?'▶ Продолжить':'Ⅱ Пауза';pause.setAttribute('aria-pressed',String(paused));}syncPause();pause.onclick=()=>{paused=!paused;syncPause();};
document.querySelector('#speed').oninput=e=>{speed=+e.target.value;document.querySelector('#speedValue').textContent=speed+'×';};
document.querySelector('#color').value='#5297ff';document.querySelector('#color').oninput=e=>liquidMat.color.set(e.target.value);
document.querySelector('#restart').onclick=()=>{time=0;};
document.querySelector('#theme').onclick=e=>{const light=document.body.classList.toggle('light');e.target.textContent=light?'Тёмный фон':'Светлый фон';};
new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=width<500?9.5:7.7;camera.updateProjectionMatrix();}).observe(host);
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!paused&&!document.hidden)time+=dt*speed;const cycle=time%12;const fill=(1-Math.cos(cycle/12*Math.PI*2))/2;coin.rotation.y=time*Math.PI/3;water(-R+2*R*fill,time);document.querySelector('#percent').textContent=Math.round(fill*100)+'%';document.querySelector('#state').textContent=cycle<6?'Наполняем возможности':'Продолжаем движение';renderer.render(scene,camera);}
requestAnimationFrame(frame);

