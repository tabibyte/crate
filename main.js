const ALBUM_WIDTH = 2;
const ALBUM_HEIGHT = 2;
const ALBUM_SPACING = 0.7;
const ALBUM_TILT = -0.75;
const TRANSITION_DURATION = 1;
const TRANSITION_EASE = "power2.out";
const INITIAL_DELAY = 0.2;
const LOADING_DURATION = 2;
const ALBUM_CORNER_RADIUS = 0.1;
const Z_SPACING = 0.05;

let isLoading = true;
let isClicked = false;

const albums = [
    {
        title: "hues",
        image: "album1.png",
        description: "First album description"
    },
    {
        title: "Album 2",
        image: "album2.png",
        description: "Second album description"
    },
    {
        title: "Album 3",
        image: "album3.png",
        description: "Second album description"
    },
    {
        title: "Album 3",
        image: "album9.png",
        description: "Third album description"
    },
    {
        title: "Album 3",
        image: "album7.png",
        description: "Third album description"
    },
    {
        title: "Album 3",
        image: "album8.png",
        description: "Third album description"
    },
    {
        title: "Album 3",
        image: "album6.png",
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
    
    let loadedCount = 0;
    let loadedMeshes = [];

    albums.forEach((album, index) => {
        textureLoader.load(album.image, (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.flipY = false;
            texture.generateMipmaps = false;


            texture.matrixAutoUpdate = false;
            texture.matrix.scale(1, 1);
            texture.needsUpdate = true;

            const roundedRectShape = createRoundedRectShape(ALBUM_WIDTH, ALBUM_HEIGHT, ALBUM_CORNER_RADIUS);
            const geometry = roundedRectShape;
            const material = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                depthTest: true
            });

            const mesh = new THREE.Mesh(geometry, material);
            const yPos = startY - (index * ALBUM_SPACING);
            const zPos = -index * Z_SPACING;
            


            // Store initial positions consistently
            mesh.userData.albumData = album;
            mesh.userData.index = index;
            mesh.userData.originalY = yPos;
            mesh.userData.originalZ = -index * 0.15;
            mesh.userData.originalRotation = ALBUM_TILT;

            // Set initial state
            mesh.userData.albumData = album;
            mesh.userData.index = index;
            mesh.userData.originalY = yPos;
            mesh.userData.originalZ = -index * 0.15;
            mesh.userData.originalRotation = ALBUM_TILT;
            mesh.renderOrder = albums.length - index;
            
            loadedMeshes[index] = mesh; // Store in order
            loadedCount++;

            // Only add meshes when all are loaded
            if (loadedCount === albums.length) {
                loadedMeshes.forEach(mesh => {
                    albumMeshes.push(mesh);
                    sceneContainer.add(mesh);
                    
                    // Entrance animation
                    const timeline = gsap.timeline({
                        delay: mesh.userData.index * INITIAL_DELAY,
                        onStart: () => {
                            mesh.visible = true;
                        }
                    });

                    timeline
                        .to(mesh.position, {
                            y: mesh.userData.originalY,
                            x: 0,
                            z: mesh.userData.originalZ,
                            duration: 1.5,
                            ease: "elastic.out(1, 0.75)"
                        })
                        .to(mesh.rotation, {
                            x: ALBUM_TILT,
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
                });

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
        x: -2,
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

    // Push other albums vertically and reduce opacity
    albumMeshes.forEach((mesh) => {
        if (mesh !== clickedMesh) {
            const meshIndex = mesh.userData.index;
            const isAbove = meshIndex < clickedIndex;
            const isBelow = meshIndex > clickedIndex;
            
            if (isAbove || isBelow) {
                gsap.to(mesh.position, {
                    y: mesh.userData.originalY + (isAbove ? 1.2 : -1.2),
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
                gsap.to(mesh.material, {
                    opacity: 0.3,
                    duration: TRANSITION_DURATION,
                    ease: TRANSITION_EASE
                });
            }
        }
    });

    // Calculate and set album info position
    const screenY = (clickedMesh.position.y / 5) * window.innerHeight + (window.innerHeight / 2);
    const albumInfo = document.getElementById('albumInfo');
    albumInfo.style.top = `22%`;
    albumInfo.style.left = '60%';
    
    // Update album info content
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