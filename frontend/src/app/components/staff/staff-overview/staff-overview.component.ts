import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcademicOverviewPeriod, AcademicOverviewYear } from '@interfaces/academic-overview';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-staff-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './staff-overview.component.html',
  styleUrl: './staff-overview.component.scss'
})
export class StaffOverviewComponent {
  @Input() overview: AcademicOverviewYear[] | null = null;

  formatBranches(period: AcademicOverviewPeriod): string {
    const names = (period?.branches ?? [])
      .map((b) => b?.name)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return names.length ? names.join(', ') : '—';
  }

  formatClasses(period: AcademicOverviewPeriod): string {
    const names = (period?.classes ?? [])
      .map((c) => c?.name)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return names.length ? names.join(', ') : '—';
  }
}

