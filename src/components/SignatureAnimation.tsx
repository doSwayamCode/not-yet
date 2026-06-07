'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SignatureAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dimensions
    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Generate Text Coordinates (State B)
    // We draw "NOT YET" on a hidden 2D canvas to get particle destinations
    const canvas2d = document.createElement('canvas');
    const ctx2d = canvas2d.getContext('2d')!;
    canvas2d.width = 300;
    canvas2d.height = 100;
    
    ctx2d.fillStyle = '#000000';
    ctx2d.fillRect(0, 0, canvas2d.width, canvas2d.height);
    ctx2d.font = 'bold 36px sans-serif';
    ctx2d.fillStyle = '#ffffff';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText('NOT YET', canvas2d.width / 2, canvas2d.height / 2);

    const imgData = ctx2d.getImageData(0, 0, canvas2d.width, canvas2d.height);
    const textPoints: THREE.Vector3[] = [];

    // Sample pixels
    const sampleRate = 2; // Sample every 2nd pixel
    for (let y = 0; y < canvas2d.height; y += sampleRate) {
      for (let x = 0; x < canvas2d.width; x += sampleRate) {
        const index = (y * canvas2d.width + x) * 4;
        const r = imgData.data[index];
        if (r > 128) {
          // Map to 3D coordinate system (centered)
          const px = (x - canvas2d.width / 2) * 0.45;
          const py = -(y - canvas2d.height / 2) * 0.45;
          const pz = (Math.random() - 0.5) * 5; // slight depth
          textPoints.push(new THREE.Vector3(px, py, pz));
        }
      }
    }

    const particleCount = 2500;
    const initialPositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Initialize random floating positions (State A) and assign target positions (State B)
    for (let i = 0; i < particleCount; i++) {
      // Random cloud
      const rx = (Math.random() - 0.5) * 150;
      const ry = (Math.random() - 0.5) * 150;
      const rz = (Math.random() - 0.5) * 150;

      initialPositions[i * 3] = rx;
      initialPositions[i * 3 + 1] = ry;
      initialPositions[i * 3 + 2] = rz;

      // Assign text point (loop back if text points run out)
      const tPoint = textPoints[i % textPoints.length];
      targetPositions[i * 3] = tPoint.x + (Math.random() - 0.5) * 2; // add slight noise
      targetPositions[i * 3 + 1] = tPoint.y + (Math.random() - 0.5) * 2;
      targetPositions[i * 3 + 2] = tPoint.z + (Math.random() - 0.5) * 2;

      // Velocity drift
      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions.slice(), 3));

    // Particle texture (glowing dot)
    // Create a circular gradient canvas texture
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 16;
    dotCanvas.height = 16;
    const dotCtx = dotCanvas.getContext('2d')!;
    const grad = dotCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(245, 176, 65, 0.8)'); // Amber glow
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dotCtx.fillStyle = grad;
    dotCtx.fillRect(0, 0, 16, 16);

    const texture = new THREE.CanvasTexture(dotCanvas);

    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Scroll tracker
    let scrollPercent = 0;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        scrollPercent = Math.min(scrollTop / docHeight, 1); // Fully formed at the bottom of the page
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const currentPos = geometry.attributes.position.array as Float32Array;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Interpolate position based on scrollPercent
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Current coordinates
        const cx = initialPositions[i3];
        const cy = initialPositions[i3 + 1];
        const cz = initialPositions[i3 + 2];

        // Target coordinates (NOT YET spelling)
        const tx = targetPositions[i3];
        const ty = targetPositions[i3 + 1];
        const tz = targetPositions[i3 + 2];

        // Drift noise (gives lifecycle feel when spelling)
        const driftX = Math.sin(time + i) * 0.2 * (1 - scrollPercent);
        const driftY = Math.cos(time + i) * 0.2 * (1 - scrollPercent);
        
        // Lerp
        currentPos[i3] = THREE.MathUtils.lerp(cx + driftX, tx, scrollPercent);
        currentPos[i3 + 1] = THREE.MathUtils.lerp(cy + driftY, ty, scrollPercent);
        currentPos[i3 + 2] = THREE.MathUtils.lerp(cz, tz, scrollPercent);
      }

      geometry.attributes.position.needsUpdate = true;

      // Rotate particle system slightly for ambient motion
      particleSystem.rotation.y = time * 0.02 * (1 - scrollPercent) + scrollPercent * 0.05;
      particleSystem.rotation.x = Math.sin(time * 0.1) * 0.02 * (1 - scrollPercent);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (containerRef.current && renderer.domElement) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch (e) {
          // ignore if already removed
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-10">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
