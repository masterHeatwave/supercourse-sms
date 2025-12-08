import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { MaterialsService } from '@gen-api/materials/materials.service';
import { Material } from '@gen-api/schemas';
import { finalize } from 'rxjs';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressSpinnerModule, ButtonModule],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss'
})
export class ResourcesComponent implements OnInit {
  @Input() classId: string | null = null;

  #materialsService = inject(MaterialsService);

  materials: Material[] = [];
  loading = false;

  ngOnInit() {
    if (this.classId) {
      this.loadMaterials();
    }
  }

  loadMaterials() {
    if (!this.classId) return;

    this.loading = true;
    this.#materialsService
      .getMaterialsTaxisTaxiId(this.classId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.materials = response.data;
          } else {
            this.materials = [];
          }
        },
        error: (error) => {
          console.error('Error fetching materials:', error);
          this.materials = [];
        }
      });
  }

  getIconUrl(material: Material): string {
    return `${environment.scapApiAssetsUrl}/${material.icon_url}`;
  }
}
