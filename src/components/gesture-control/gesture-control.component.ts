
import { Component, ChangeDetectionStrategy, ElementRef, viewChild, output, OnDestroy, signal } from '@angular/core';

declare const handpose: any;
declare const tf: any;

@Component({
  selector: 'app-gesture-control',
  template: `
    <div class="absolute bottom-4 left-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-cyan-400/50 shadow-lg bg-gray-900">
      <video #videoElement class="w-full h-full object-cover" autoplay playsinline></video>
      @if (isLoading()) {
        <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
          <p class="text-white text-sm animate-pulse">Starting Camera...</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestureControlComponent implements OnDestroy {
  private videoRef = viewChild.required<ElementRef<HTMLVideoElement>>('videoElement');
  
  public handOpennessChange = output<number>();
  public isLoading = signal(true);
  
  private model: any;
  private detectionIntervalId?: number;

  async ngAfterViewInit(): Promise<void> {
    await this.setupCamera();
    await this.loadModel();
    this.startHandDetection();
  }

  ngOnDestroy(): void {
    if (this.detectionIntervalId) {
      clearInterval(this.detectionIntervalId);
    }
    // Stop camera stream
    const videoEl = this.videoRef()?.nativeElement;
    if (videoEl && videoEl.srcObject) {
      (videoEl.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  }

  private async setupCamera(): Promise<void> {
    try {
      const videoEl = this.videoRef().nativeElement;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      videoEl.srcObject = stream;
      await new Promise((resolve) => {
        videoEl.onloadedmetadata = () => resolve(videoEl);
      });
    } catch (error) {
      console.error('Camera access denied:', error);
      this.isLoading.set(false);
      // Handle error (e.g., show a message to the user)
    }
  }

  private async loadModel(): Promise<void> {
    try {
      await tf.setBackend('webgl');
      this.model = await handpose.load();
      this.isLoading.set(false);
    } catch (error) {
      console.error('Failed to load handpose model:', error);
    }
  }

  private startHandDetection(): void {
    this.detectionIntervalId = window.setInterval(async () => {
      if (this.model) {
        const predictions = await this.model.estimateHands(this.videoRef().nativeElement);
        if (predictions.length > 0) {
          const openness = this.calculateHandOpenness(predictions[0].landmarks);
          this.handOpennessChange.emit(openness);
        } else {
            // Default to semi-open if no hand is detected
            this.handOpennessChange.emit(0.5);
        }
      }
    }, 100); // Detect every 100ms for performance
  }
  
  private calculateHandOpenness(landmarks: [number, number, number][]): number {
    // A simple metric for hand openness: average distance of fingertips to the wrist.
    const wrist = landmarks[0];
    const fingertips = [
      landmarks[4], // Thumb
      landmarks[8], // Index
      landmarks[12], // Middle
      landmarks[16], // Ring
      landmarks[20], // Pinky
    ];
    
    let totalDistance = 0;
    for (const tip of fingertips) {
      const dx = tip[0] - wrist[0];
      const dy = tip[1] - wrist[1];
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    
    const avgDistance = totalDistance / fingertips.length;
    
    // Normalize the value. These min/max values are empirical and may need tuning.
    const minDistance = 50;
    const maxDistance = 250;
    const openness = (avgDistance - minDistance) / (maxDistance - minDistance);
    
    return Math.max(0, Math.min(1, openness)); // Clamp between 0 and 1
  }
}
