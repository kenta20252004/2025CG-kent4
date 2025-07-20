//23FI032 川島健太郎
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as CANNON from "cannon-es";

class ThreeJSContainer {
    private scene: THREE.Scene;
    private light: THREE.Light;

    constructor() { }

    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.shadowMap.enabled = true;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0,25,0);
        //camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0,4,0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();

        const render: FrameRequestCallback = (time) => {
            orbitControls.update();
            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    };

    private createScene = () => {
        this.scene = new THREE.Scene();

        const cubeMeshes: THREE.Mesh[] = [];
        const cubeBodies: CANNON.Body[] = [];

        const num1 = 25;
        const num2 = 15;
        const space = 0.6;//ドミノの間隔調整

        const cubeShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.5, 0.1));

        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
        world.defaultContactMaterial.friction = 0.01;//摩擦係数
        world.defaultContactMaterial.restitution = 0.9;//反発係数

        const geometry = new THREE.BoxGeometry(0.5, 1, 0.2);//geometry
        let material;//material

        for (let i = 0; i < num1; i++) {
            for (let j = 0; j < num2; j++) {
                const x = (i - num1 / 2) * space;//x座標
                const z = (j - num2 / 2) * space;//z座標

                if ((i >= 1 && i <= 6 && j == 3) || (i >= 3 && i <= 4 && j >= 3 && j <= 10)
                    || (i == 9 && j >= 3 && j <= 10) || (i >= 10 && i <= 12 && (j == 3 || j == 10)) || (i == 13 && (j == 4 || j == 9)) || (i == 14 && j >= 5 && j <= 8)
                    || (i == 17 && j >= 3 && j <= 9) || (j == 10 && i >= 18 && i <= 21) || (i == 22 && j >= 3 && j <= 9)) {
                    //↑の条件を満たしたドミノが青になる👇
                    material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
                } else {
                    //それ以外は白
                    material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
                }

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 0.5, z);
                if (j === 0) mesh.rotateX(0.5);//1列目のドミノを傾ける

                this.scene.add(mesh);
                cubeMeshes.push(mesh);

                const body = new CANNON.Body({ mass: 2 });//2kg
                body.addShape(cubeShape);
                body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);//positionの初期化
                body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);//quaternionの初期化
                cubeBodies.push(body);
                world.addBody(body);
            }
        }

        //地面
        const phongMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,//透明
            side: THREE.DoubleSide//両面表示
        });
        const planeGeometry = new THREE.PlaneGeometry(25, 25);
        const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
        planeMesh.rotateX(-Math.PI / 2);
        this.scene.add(planeMesh);//シーンの追加

        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0 });//0kg
        planeBody.addShape(planeShape);
        planeBody.position.set(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);//positionの初期化
        planeBody.quaternion.set(planeMesh.quaternion.x, planeMesh.quaternion.y, planeMesh.quaternion.z, planeMesh.quaternion.w);//quaternionの初期化
        world.addBody(planeBody);

        //ライト
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        //花火(パーティクルの生成)
        const particleCount = 500;
        const particlesGeometry = new THREE.BufferGeometry();
        const radius = 6;
        const positions = new Float32Array(particleCount * 3);//500*3の配列を用意
        const velocities = new Float32Array(particleCount * 3);//花火で使う

        for (let i = 0; i < particleCount; i++) {
            const theta = (i / particleCount) * Math.PI * 2;
            positions[i * 3 + 0] = Math.cos(theta) * radius;//xは円を描くイメージ
            positions[i * 3 + 1] = 2;//y=2
            positions[i * 3 + 2] = Math.sin(theta) * radius;//zは円を描くイメージ

            //最初は動かない
            velocities[i * 3 + 0] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
        }

        const colors = new Float32Array(particleCount * 3);//色の配列を用意
        for (let i = 0; i < particleCount; i++) {
            let color: THREE.Color;
            const r = Math.random();

            //色のランダム生成
            if (r < 0.125) {
                color = new THREE.Color(0xff0000);//赤
            } else if (r >= 0.125 && r < 0.250) {
                color = new THREE.Color(0xffff00);//黄色
            } else if (r >= 0.25 && r < 0.375) {
                color = new THREE.Color(0xff00ff);//マゼンタ
            } else if (r >= 0.375 && r < 0.50) {
                color = new THREE.Color(0x00ff00);//緑
            } else if (r >= 0.50 && r < 0.625) {
                color = new THREE.Color(0x00ffff);//シアン
            } else if (r >= 0.625 && r < 0.75) {
                color = new THREE.Color(0x0000ff);//青
            } else if (r >= 0.75 && r < 0.875) {
                color = new THREE.Color(0x000000);//黒
            } else if (r >= 0.875) {
                color = new THREE.Color(0xffffff);//白
            }

            //配列に格納
            colors[i * 3 + 0] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        //オブジェクトを作成
        particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.15,
            transparent: true,
            opacity: 0.9,
            vertexColors: true//カラフルにするために追加
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);//meshの作成
        particles.visible = false;//最初は非表示
        this.scene.add(particles);

        let startTime = performance.now();
        let hasLaunched = false;//花火の打ち上げ
        let hasExploded = false;//爆発
        let sCount = 0;//爆発の回数
        const launchHeight = 8;//ここまでいったら爆発

        const update: FrameRequestCallback = () => {
            requestAnimationFrame(update);

            world.fixedStep();
            for (let i = 0; i < cubeMeshes.length; i++) {
                cubeMeshes[i].position.set(cubeBodies[i].position.x, cubeBodies[i].position.y, cubeBodies[i].position.z);
                cubeMeshes[i].quaternion.set(cubeBodies[i].quaternion.x, cubeBodies[i].quaternion.y, cubeBodies[i].quaternion.z, cubeBodies[i].quaternion.w);
            }

            //属性に関して
            const posAttr = particlesGeometry.getAttribute("position") as THREE.BufferAttribute;
            const velAttr = particlesGeometry.getAttribute("velocity") as THREE.BufferAttribute;


            const elapsed = (performance.now() - startTime) / 1000;//時間経過
            const waitTime = sCount === 0 ? 6 : 1;


            if (!hasLaunched && elapsed >= waitTime) {
                hasLaunched = true;
                particles.visible = true;
                sCount++;
            }

            
            //パーティクルの情報更新
            for (let i = 0; i < particleCount; i++) {
                let x = posAttr.getX(i);
                let y = posAttr.getY(i);
                let z = posAttr.getZ(i);

                //アニメーションが開始して6秒たっていたら
                if (!hasLaunched && elapsed >= 6) {
                    hasLaunched = true;//開始
                    particles.visible = true;//パーティクルが見える
                }

                //開始かつまだ爆発していない
                if (hasLaunched && !hasExploded) {
                    y += 0.1;//パーティクルが上昇
                    if (y >= launchHeight) {//高さが8以上
                        hasExploded = true;//爆発
                        //ランダムな速度ベクトルを付与
                        for (let j = 0; j < particleCount; j++) {
                            const theta = (j / particleCount) * Math.PI * 2;
                            const radius = 0.2 + Math.random() * 0.1;
                            const vx = Math.cos(theta) * radius;
                            const vy = 0.3 + Math.random() * 0.1;
                            const vz = Math.sin(theta) * radius;
                            velAttr.setXYZ(j, vx, vy, vz);
                        }
                        //更新
                        velAttr.needsUpdate = true;
                    }
                    posAttr.setY(i, y);
                }

                //爆発したら
                if (hasExploded) {
                    //位置情報を取得
                    const vx = velAttr.getX(i);//xの速度ベクトル
                    const vy = velAttr.getY(i);//yの速度ベクトル
                    const vz = velAttr.getZ(i);//zの速度ベクトル

                    posAttr.setXYZ(i, x + vx, y + vy, z + vz);//position更新
                    velAttr.setXYZ(i, vx * 0.98, vy * 0.98 - 0.01, vz * 0.98);//物理演算
                }
            }

            posAttr.needsUpdate = true;

            //爆発したら
            if (hasExploded) {
                let allBelow = true;
                for (let i = 0; i < particleCount; i++) {//パーティクルがy<0になると
                    if (posAttr.getY(i) > 0) {
                        allBelow = false;
                        break;
                    }
                }

                if (allBelow) {
                    for (let i = 0; i < particleCount; i++) {
                        //リセット
                        posAttr.setXYZ(i, 0, 0, 0);
                        velAttr.setXYZ(i, 0, 0, 0);
                    }

                    //更新
                    posAttr.needsUpdate = true;
                    velAttr.needsUpdate = true;

                    //時間のリセット
                    startTime = performance.now();

                    //フラグとパーティクルのリセット
                    hasLaunched = false;
                    hasExploded = false;
                    particles.visible = false;

                    //新しい速度ベクトルの作成
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (i / particleCount) * Math.PI * 2;
                        const radius = 0.2 + Math.random() * 0.1;
                        const vx = Math.cos(angle) * radius;
                        const vy = 0.3 + Math.random() * 0.1;
                        const vz = Math.sin(angle) * radius;
                        velAttr.setXYZ(i, vx, vy, vz);
                    }
                    velAttr.needsUpdate = true;
                }
            }
            posAttr.needsUpdate = true;

        };

        requestAnimationFrame(update);

    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();
    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(5, 5, 5));
    document.body.appendChild(viewport);
}
