import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ViewAcademicYearComponent } from '@components/academic-years/view-academic-year/view-academic-year.component';
import { AcademicService, AcademicYear } from '@services/academic.service';

@Component({
  selector: 'app-single-academic-year',
  standalone: true,
  imports: [
    CommonModule,
    ViewAcademicYearComponent
  ],
  templateUrl: './single.component.html',
  styleUrl: './single.component.scss'
})
export class SingleAcademicYearComponent implements OnInit {
  academicYear: AcademicYear | null = null;
  loading = true;
  error = false;

  constructor(private route: ActivatedRoute, private academicService: AcademicService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.loading = false;
      return;
    }

    this.academicService.getAcademicYearById(id).subscribe({
      next: (year) => {
        this.academicYear = year;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }
}

