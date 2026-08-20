import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(() => {
    const mount = document.querySelector("#three-scene");
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const purpleFill = new THREE.PointLight(0xb45cff, 8, 10);
    purpleFill.position.set(-3, 1, 3);
    scene.add(purpleFill);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.position.set(0.4, 0.4, 0);
    scene.add(group);

    const raspberryPi = new THREE.Group();
    let animatedObject = raspberryPi;
    raspberryPi.rotation.set(-0.28, 0.18, -0.08);
    group.add(raspberryPi);

    const addPart = (width, height, depth, x, y, z, color, opacity = 1) => {
        const material = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
        const part = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        part.position.set(x, y, z);
        raspberryPi.add(part);
        return part;
    };

    addPart(3.2, 2.05, 0.12, 0, 0, 0, 0x176b45);
    addPart(2.85, 1.72, 0.02, 0, 0, 0.07, 0x208b59, 0.32);

    for (let pin = 0; pin < 20; pin += 1) {
        addPart(0.045, 0.12, 0.08, -1.12 + (pin % 2) * 0.09, 0.72 - Math.floor(pin / 2) * 0.075, 0.13, 0xd8a832);
    }

    addPart(0.62, 0.52, 0.15, -0.45, 0.1, 0.15, 0x15151d);
    addPart(0.36, 0.3, 0.08, -0.45, 0.1, 0.24, 0x252533);
    addPart(0.48, 0.28, 0.13, 0.45, 0.42, 0.15, 0x333344);
    addPart(0.34, 0.22, 0.1, 0.45, 0.42, 0.23, 0x111118);

    addPart(0.52, 0.34, 0.28, 1.28, 0.48, 0.08, 0x9c9ca8);
    addPart(0.52, 0.34, 0.28, 1.28, 0.02, 0.08, 0x9c9ca8);
    addPart(0.62, 0.42, 0.28, 1.25, -0.62, 0.08, 0x15151d);

    for (let trace = 0; trace < 5; trace += 1) {
        addPart(0.75, 0.018, 0.018, -0.05 + trace * 0.18, -0.35, 0.14, 0xb45cff, 0.55);
    }

    const ledMaterial = new THREE.MeshBasicMaterial({ color: 0xb45cff });
    for (let led = 0; led < 3; led += 1) {
        const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), ledMaterial);
        indicator.position.set(0.75 + led * 0.13, -0.18, 0.18);
        raspberryPi.add(indicator);
    }

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
        const radius = 1.8 + Math.random() * 1.8;
        const angle = Math.random() * Math.PI * 2;
        particlePositions[index * 3] = Math.cos(angle) * radius;
        particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 3.8;
        particlePositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.025,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const modelLoader = new GLTFLoader();
    modelLoader.load("assets/raspberry.glb", (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(0.03);
        model.position.set(0, -0.55, 0.15);
        model.rotation.set(-0.22, 0.2, -0.08);
        group.remove(raspberryPi);
        group.add(model);
        animatedObject = model;
    }, undefined, () => {
        animatedObject = raspberryPi;
    });

    const pointer = { x: 0, y: 0 };
    const updatePointer = (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const resize = () => {
        const width = mount.clientWidth || window.innerWidth;
        const height = mount.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    resize();

    const animate = (time) => {
        if (!reducedMotion) {
            const seconds = time * 0.00035;
            animatedObject.rotation.x = -0.28 + Math.sin(seconds * 2) * 0.08 + pointer.y * 0.12;
            animatedObject.rotation.y = 0.18 + seconds * 1.2 + pointer.x * 0.16;
            animatedObject.rotation.z = -0.08 + pointer.x * 0.04;
            particles.rotation.y = -seconds * 0.8 + pointer.x * 0.08;
            particles.rotation.x = pointer.y * 0.05;
            group.position.x += (pointer.x * 0.18 + 0.4 - group.position.x) * 0.025;
            group.position.y += (pointer.y * -0.12 + 0.4 - group.position.y) * 0.025;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
})();
