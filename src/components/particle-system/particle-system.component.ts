import { Component, ChangeDetectionStrategy, ElementRef, viewChild, input, effect, OnDestroy, inject, computed } from '@angular/core';
import * as THREE from 'three';
import { ShapeGeneratorService } from '../../services/shape-generator.service';

export type ShapeType = 'nebula' | 'heart';

export interface ParticleConfig {
  particleDensity: number;
  diffusion: number;
  particleColor: string;
  shape: ShapeType;
}

@Component({
  selector: 'app-particle-system',
  template: `<canvas #canvas class="w-full h-full block"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticleSystemComponent implements OnDestroy {
  private readonly MAX_PARTICLES = 50000;
  
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  public config = input.required<ParticleConfig>();
  
  private shapeGenerator = inject(ShapeGeneratorService);
  
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private particles!: THREE.Points;
  private backgroundStars!: THREE.Points;
  private animationFrameId?: number;

  private targetPositions: Float32Array;

  constructor() {
    this.targetPositions = new Float32Array(this.MAX_PARTICLES * 3);
    
    // Decompose the config into separate signals for more granular effects.
    const shape = computed(() => this.config().shape);
    const particleColor = computed(() => this.config().particleColor);
    const particleDensity = computed(() => this.config().particleDensity);

    // Effect for shape changes: Only runs when the shape is different.
    effect(() => this.updateShape(shape()));

    // Effect for color changes
    effect(() => this.updateColor(particleColor()));
    
    // Effect for density changes
    effect(() => this.updateDensity(particleDensity()));
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.createBackgroundStars();
    this.createParticleSystem();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
  }

  private initThree(): void {
    const canvas = this.canvasRef().nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private createParticleSystem(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.MAX_PARTICLES * 3);
    const initialPoints = this.shapeGenerator.generateNebula(this.MAX_PARTICLES);

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
        const i3 = i * 3;
        positions[i3] = initialPoints[i][0];
        positions[i3 + 1] = initialPoints[i][1];
        positions[i3 + 2] = initialPoints[i][2];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: this.config().particleColor,
        size: 0.2,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private createBackgroundStars(): void {
    const starCount = 5000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 1000;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 1000;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 1000;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.5 });
    this.backgroundStars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.backgroundStars);
  }

  private updateShape(shape: ShapeType): void {
    if (!this.particles) return;

    const newPoints = shape === 'nebula'
        ? this.shapeGenerator.generateNebula(this.MAX_PARTICLES)
        : this.shapeGenerator.generateHeart(this.MAX_PARTICLES);

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
        const i3 = i * 3;
        this.targetPositions[i3] = newPoints[i][0];
        this.targetPositions[i3 + 1] = newPoints[i][1];
        this.targetPositions[i3 + 2] = newPoints[i][2];
    }
  }

  private updateColor(color: string): void {
      if (!this.particles) return;
      (this.particles.material as THREE.PointsMaterial).color.set(color);
  }

  private updateDensity(density: number): void {
      if (!this.particles) return;
      const numVisibleParticles = Math.floor(this.MAX_PARTICLES * density);
      (this.particles.geometry as THREE.BufferGeometry).setDrawRange(0, numVisibleParticles);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const positions = (this.particles.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
    const diffusion = this.config().diffusion * 50; // diffusion scale factor
    const lerpFactor = 0.04;

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
        const i3 = i * 3;
        
        const currentPos = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
        const targetPos = new THREE.Vector3(this.targetPositions[i3], this.targetPositions[i3 + 1], this.targetPositions[i3 + 2]);
        
        // Add diffusion
        const randomOffset = new THREE.Vector3(
          (Math.random() - 0.5) * diffusion,
          (Math.random() - 0.5) * diffusion,
          (Math.random() - 0.5) * diffusion
        );
        targetPos.add(randomOffset);

        // Lerp towards the target
        currentPos.lerp(targetPos, lerpFactor);

        positions.setXYZ(i, currentPos.x, currentPos.y, currentPos.z);
    }

    positions.needsUpdate = true;
    this.particles.rotation.y += 0.0005;
    this.backgroundStars.rotation.y += 0.0001;

    this.renderer.render(this.scene, this.camera);
  };
}
