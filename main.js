const ALBUM_WIDTH = 2.5;
const ALBUM_HEIGHT = 2.5;
const ALBUM_SPACING = 0.8;
const ALBUM_TILT = -0.5;
const TRANSITION_DURATION = 1;
const TRANSITION_EASE = "power2.out";
const INITIAL_DELAY = 0.2;
const LOADING_DURATION = 2;
const ALBUM_CORNER_RADIUS = 0.1;

let isLoading = true;
let isClicked = false;

const albums = [
    {
        title: "Album 1",
        image: "album1.png",
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

let scene, camera, renderer, raycaster, mouse, sceneContainer;
const albumMeshes = [];

function init() {
    // Scene setup
    scene = new THREE.Scene();
    sceneContainer = new THREE.Group();
    scene.add(sceneContainer);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 0;
    camera.updateProjectionMatrix();
    camera.lookAt(scene.position);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        logarithmicDepthBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);

    // Interaction setup
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Initialize
    loadAlbums();
    addEventListeners();
    animate();
}

// Update animate function
function animate() {
    requestAnimationFrame(animate);
    handleHover();
    renderer.render(scene, camera);
}

function loadAlbums() {
    const textureLoader = new THREE.TextureLoader();
    const totalHeight = (albums.length - 1) * ALBUM_SPACING;
    const startY = totalHeight / 2;
    const material = new THREE.MeshBasicMaterial({ 
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: true,
    });
    
    let loadedCount = 0;

    albums.forEach((album, index) => {
        textureLoader.load(album.image, (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.flipY = false;
            texture.generateMipmaps = false; // Prevent mipmap artifacts

            const roundedRectShape = createRoundedRectShape(ALBUM_WIDTH, ALBUM_HEIGHT, ALBUM_CORNER_RADIUS);
            const geometry = roundedRectShape;
            const material = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0,
                depthWrite: false, // Prevent depth writing artifacts
                depthTest: true
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Initial state
            const yPos = startY - (index * ALBUM_SPACING);
            mesh.position.y = yPos - 10;
            mesh.position.z = -index * 0.15;
            mesh.position.x = -5;
            mesh.rotation.x = ALBUM_TILT;
            mesh.rotation.y = Math.PI * 0.5;
            mesh.scale.set(0.5, 0.5, 0.5);
            mesh.renderOrder = albums.length - index; // Ensure proper render order

            mesh.userData.albumData = album;
            mesh.userData.index = index;
            mesh.userData.originalY = yPos;
            mesh.userData.originalZ = -index * 0.15;
            mesh.userData.originalRotation = ALBUM_TILT;

            albumMeshes.push(mesh);
            sceneContainer.add(mesh);

            // Modified entrance animation
            const timeline = gsap.timeline({
                delay: index * INITIAL_DELAY,
                onStart: () => {
                    mesh.visible = true; // Ensure visibility
                }
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
    if (isLoading || isClicked) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(albumMeshes);

    // Kill existing animations
    albumMeshes.forEach(mesh => {
        gsap.killTweensOf(mesh.position);
        gsap.killTweensOf(mesh.rotation);
        gsap.killTweensOf(mesh.material);
    });

    // Reset all albums
    albumMeshes.forEach(mesh => {
        gsap.to(mesh.position, {
            y: mesh.userData.originalY,
            z: mesh.userData.originalZ,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        gsap.to(mesh.rotation, {
            x: ALBUM_TILT,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        gsap.to(mesh.material, {
            opacity: 1,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
    });

    if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        const hoveredIndex = hoveredMesh.userData.index;

        // Animate hovered album
        gsap.to(hoveredMesh.position, {
            y: hoveredMesh.userData.originalY - 0.2,
            z: hoveredMesh.userData.originalZ + 0.5,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        
        gsap.to(hoveredMesh.rotation, {
            x: 0,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        
        gsap.to(hoveredMesh.material, {
            opacity: 1,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });

        // Animate other albums
        albumMeshes.forEach((mesh) => {
            if (mesh !== hoveredMesh) {
                const meshIndex = mesh.userData.index;
                const isAbove = meshIndex < hoveredIndex;
                const isBelow = meshIndex > hoveredIndex;
                
                if (isAbove || isBelow) {
                    gsap.to(mesh.position, {
                        y: mesh.userData.originalY + (isAbove ? 0.8 : -0.8),
                        z: mesh.userData.originalZ - 0.4,
                        duration: TRANSITION_DURATION,
                        ease: TRANSITION_EASE
                    });
                }
            }
        });
    }
}

function handleClick(event) {
    if (isLoading) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(albumMeshes);

    // Kill all ongoing animations
    albumMeshes.forEach(mesh => {
        gsap.killTweensOf(mesh.position);
        gsap.killTweensOf(mesh.rotation);
        gsap.killTweensOf(mesh.material);
    });
    gsap.killTweensOf(sceneContainer.position);

    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        
        // If any album is already selected, just reset everything
        if (isClicked) {
            isClicked = false;
            albumMeshes.forEach(mesh => {
                mesh.isSelected = false;
                gsap.to(mesh.position, {
                    y: mesh.userData.originalY,
                    z: mesh.userData.originalZ,
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
                gsap.to(mesh.rotation, {
                    x: ALBUM_TILT,
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
                gsap.to(mesh.material, {
                    opacity: 1,
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
            });
            
            gsap.to(sceneContainer.position, {
                x: 0,
                duration: TRANSITION_DURATION,
                ease: TRANSITION_EASE
            });
            
            document.getElementById('albumInfo').style.display = 'none';
            return;
        }

        // If no album is selected, select this one
        selectNewAlbum(clickedMesh);
    } else {
        // Clicked away - reset everything
        isClicked = false;
        albumMeshes.forEach(mesh => {
            mesh.isSelected = false;
            gsap.to(mesh.position, {
                y: mesh.userData.originalY,
                z: mesh.userData.originalZ,
                duration: TRANSITION_DURATION,
                ease: TRANSITION_EASE
            });
            gsap.to(mesh.rotation, {
                x: ALBUM_TILT,
                duration: TRANSITION_DURATION,
                ease: TRANSITION_EASE
            });
            gsap.to(mesh.material, {
                opacity: 1,
                duration: TRANSITION_DURATION,
                ease: TRANSITION_EASE
            });
        });
        
        gsap.to(sceneContainer.position, {
            x: 0,
            duration: TRANSITION_DURATION,
            ease: TRANSITION_EASE
        });
        
        document.getElementById('albumInfo').style.display = 'none';
    }
}

function selectNewAlbum(clickedMesh) {
    isClicked = true;
    albumMeshes.forEach(mesh => mesh.isSelected = false);
    clickedMesh.isSelected = true;
    
    const albumData = clickedMesh.userData.albumData;
    const clickedIndex = clickedMesh.userData.index;

    // Move scene container left
    gsap.to(sceneContainer.position, {
        x: -3,
        duration: TRANSITION_DURATION,
        ease: TRANSITION_EASE
    });

    // Straighten selected album and keep full opacity
    gsap.to(clickedMesh.rotation, {
        x: 0,
        duration: TRANSITION_DURATION,
        ease: TRANSITION_EASE
    });
    gsap.to(clickedMesh.material, {
        opacity: 1,
        duration: TRANSITION_DURATION,
        ease: TRANSITION_EASE
    });

    

    albumMeshes.forEach((mesh) => {
        if (mesh !== clickedMesh) {
            const meshIndex = mesh.userData.index;
            const isAbove = meshIndex < clickedIndex;
            const isBelow = meshIndex > clickedIndex;
            
            if (isAbove || isBelow) {
                gsap.to(mesh.position, {
                    y: mesh.userData.originalY + (isAbove ? 0.8 : -0.8),
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
                gsap.to(mesh.material, {
                    opacity: 0.1,
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
            }
        }
    });

    document.getElementById('albumTitle').textContent = albumData.title;
    document.getElementById('albumDescription').textContent = albumData.description;
    document.getElementById('albumInfo').style.display = 'block';
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

function createRoundedRectShape(width, height, radius) {
    // Create shape as before
    const shape = new THREE.Shape();
    
    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
    shape.lineTo(width/2, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
    shape.lineTo(-width/2, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    // Add UV mapping
    const geometry = new THREE.ShapeGeometry(shape);
    const uvs = geometry.attributes.uv;
    const positions = geometry.attributes.position;

    for (let i = 0; i < uvs.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        uvs.setXY(
            i,
            (x + width/2) / width,
            1 - ((y + height/2) / height)
        );
    }

    return geometry;
}

init();