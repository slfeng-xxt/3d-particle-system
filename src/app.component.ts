
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticleSystemComponent, ParticleConfig } from './components/particle-system/particle-system.component';
import { UiControlComponent, UIConfig } from './components/ui-control/ui-control.component';
import { GestureControlComponent } from './components/gesture-control/gesture-control.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ParticleSystemComponent, UiControlComponent, GestureControlComponent],
})
export class AppComponent {
  // Signals to hold the application state
  readonly isCameraOn = signal(false);
  private readonly handOpenness = signal(0.5); // 0 (closed) to 1 (open)
  private readonly uiConfig = signal<UIConfig>({
    particleDensity: 0.6,
    diffusion: 0.5,
    particleColor: '#00ffff',
    shape: 'nebula',
  });

  // Computed signal that combines UI settings and gesture input into a final config for the particle system
  readonly particleConfig = computed<ParticleConfig>(() => {
    const config = this.uiConfig();
    // Hand gesture overrides the diffusion slider if the camera is on
    const diffusion = this.isCameraOn() ? this.handOpenness() : config.diffusion;
    return { ...config, diffusion };
  });

  // Event handler for changes from the UI control panel
  onUiConfigChange(newConfig: UIConfig): void {
    this.uiConfig.set(newConfig);
  }

  // Event handler for camera toggle
  onCameraToggle(isOn: boolean): void {
    this.isCameraOn.set(isOn);
  }

  // Event handler for hand openness data from the gesture control component
  onHandOpennessChange(openness: number): void {
    // Smooth the value a bit to prevent jerky movements
    this.handOpenness.update(current => current * 0.8 + openness * 0.2);
  }
}
