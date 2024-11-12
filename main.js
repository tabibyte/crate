const ALBUM_WIDTH = 2;
const ALBUM_HEIGHT = 2;
const ALBUM_SPACING = 1;
const ALBUM_TILT = -0.75;
const TRANSITION_DURATION = 1;
const TRANSITION_EASE = "power2.out";
const INITIAL_DELAY = 0.2;
const LOADING_DURATION = 2;
let isLoading = true;

const albums = [
    {
        title: "Album 1",
        image: "https://picsum.photos/500/500?random=1", // placeholder images
        description: "First album description"
    },
    {
        title: "Album 2",
        image: "https://picsum.photos/500/500?random=2",
        description: "Second album description"
    },
    {
        title: "Album 3",
        image: "https://picsum.photos/500/500?random=3",
        description: "Third album description"
    }
];

let scene, camera, renderer, raycaster, mouse;
const albumMeshes = [];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    camera.position.z = 5;
    camera.position.y = 0;

    loadAlbums();
    addEventListeners();
    animate();
}

function loadAlbums() {
    const textureLoader = new THREE.TextureLoader();
    const totalHeight = (albums.length - 1) * ALBUM_SPACING;
    const startY = totalHeight / 2;
    
    let loadedCount = 0;

    albums.forEach((album, index) => {
        textureLoader.load(album.image, (texture) => {
            const geometry = new THREE.PlaneGeometry(ALBUM_WIDTH, ALBUM_HEIGHT);
            const material = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0
            });
            const mesh = new THREE.Mesh(geometry, material);

            // Initial state
            const yPos = startY - (index * ALBUM_SPACING);
            mesh.position.y = yPos - 10; // Start below viewport
            mesh.position.z = -index * 0.15;
            mesh.position.x = -5; // Start from left
            mesh.rotation.x = ALBUM_TILT;
            mesh.rotation.y = Math.PI * 0.5; // Start rotated
            mesh.scale.set(0.5, 0.5, 0.5); // Start smaller

            mesh.userData.albumData = album;
            mesh.userData.index = index;
            mesh.userData.originalY = yPos;
            mesh.userData.originalZ = -index * 0.15;
            mesh.userData.originalRotation = ALBUM_TILT;

            albumMeshes.push(mesh);
            scene.add(mesh);

            // Complex entrance animation
            const timeline = gsap.timeline({
                delay: index * INITIAL_DELAY
            });

            timeline
                .to(mesh.position, {
                    y: yPos,
                    x: 0,
                    duration: 1.5,
                    ease: "elastic.out(1, 0.75)"
                })
                .to(mesh.rotation, {
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out"
                }, "-=1.5")
                .to(mesh.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 1.2,
                    ease: "back.out(1.7)"
                }, "-=1.2")
                .to(mesh.material, {
                    opacity: 0.9,
                    duration: 0.8,
                    ease: "power2.out"
                }, "-=0.8");

            if (++loadedCount === albums.length) {
                setTimeout(() => {
                    isLoading = false;
                }, (albums.length * INITIAL_DELAY + 1.5) * 1000);
            }
        });
    });
}

function handleHover() {
    if (isLoading) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(albumMeshes);

    // Reset all albums
    albumMeshes.forEach(mesh => {
        gsap.to(mesh.material, {
            opacity: 0.9,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        gsap.to(mesh.position, {
            y: mesh.userData.originalY,
            z: mesh.userData.originalZ,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        // Reset rotation
        gsap.to(mesh.rotation, {
            x: mesh.userData.originalRotation,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
    });

    if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        const hoveredIndex = hoveredMesh.userData.index;

        // Bring hovered album forward and straighten
        gsap.to(hoveredMesh.material, {
            opacity: 1,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        gsap.to(hoveredMesh.position, {
            z: 1,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        // Straighten the hovered album
        gsap.to(hoveredMesh.rotation, {
            x: 0,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });

        // Push other albums
        albumMeshes.forEach((mesh) => {
            if (mesh !== hoveredMesh) {
                const meshIndex = mesh.userData.index;
                const isAbove = meshIndex < hoveredIndex;
                const isBelow = meshIndex > hoveredIndex;
                
                if (isAbove || isBelow) {
                    gsap.to(mesh.position, {
                        y: mesh.userData.originalY + (isAbove ? 0.4 : -0.4),
                        z: -0.5,
                        duration: TRANSITION_DURATION,
                        ease: TRANSITION_EASE
                    });
                }
            }
        });
    }
}

function handleClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(albumMeshes);

    if (intersects.length > 0) {
        const albumData = intersects[0].object.userData.albumData;
        document.getElementById('albumTitle').textContent = albumData.title;
        document.getElementById('albumDescription').textContent = albumData.description;
        document.getElementById('albumInfo').style.display = 'block';
    } else {
        document.getElementById('albumInfo').style.display = 'none';
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function addEventListeners() {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function animate() {
    requestAnimationFrame(animate);
    handleHover();
    renderer.render(scene, camera);
}


init();