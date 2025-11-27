
import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UIConfig {
  particleDensity: number;
  diffusion: number;
  particleColor: string;
  shape: 'nebula' | 'heart';
}

@Component({
  selector: 'app-ui-control',
  templateUrl: './ui-control.component.html',
  styleUrls: ['./ui-control.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiControlComponent {
  public initialConfig = input.required<UIConfig>();
  public isCameraOn = input.required<boolean>();
  public handOpenness = input.required<number>();

  public configChange = output<UIConfig>();
  public cameraToggle = output<boolean>();

  protected config = signal<UIConfig>({ particleDensity: 0.5, diffusion: 0.5, particleColor: '#ffffff', shape: 'nebula'});

  constructor() {
    // Sync internal signal with input
    effect(() => this.config.set(this.initialConfig()), { allowSignalWrites: true });
  }

  onDensityChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.updateConfig({ particleDensity: value });
  }

  onDiffusionChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.updateConfig({ diffusion: value });
  }

  onColorChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateConfig({ particleColor: value });
  }

  setShape(shape: 'nebula' | 'heart'): void {
    this.updateConfig({ shape });
  }

  toggleCamera(): void {
    this.cameraToggle.emit(!this.isCameraOn());
  }
  
  private updateConfig(newValues: Partial<UIConfig>): void {
    const newConfig = { ...this.config(), ...newValues };
    this.config.set(newConfig);
    this.configChange.emit(newConfig);
  }
}
