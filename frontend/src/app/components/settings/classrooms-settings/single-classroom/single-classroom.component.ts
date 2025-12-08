import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { PrimaryTextareaComponent } from '@components/inputs/primary-textarea/primary-textarea.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { MessageService } from 'primeng/api';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { ClassroomWithFormatted, ClassroomService } from '@services/classroom.service';
import { Classroom } from '@gen-api/schemas';

@Component({
  selector: 'app-single-classroom',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    CardModule,
    DividerModule,
    SpinnerComponent,
    PrimaryTextareaComponent,
    OutlineButtonComponent
  ],
  templateUrl: './single-classroom.component.html',
  styleUrl: './single-classroom.component.scss'
})
export class SingleClassroomComponent implements OnInit, AfterViewInit {
  @ViewChild('galleryScroll') galleryScroll!: ElementRef;
  
  classroom: ClassroomWithFormatted | null = null;
  isLoading: boolean = false;
  classroomId: string | null = null;
  
  // Gallery images - Replace these with actual classroom images
  galleryImages: string[] = [
    'assets/images/placeholder-classroom.jpg',
    'assets/images/placeholder-classroom.jpg',
    'assets/images/placeholder-classroom.jpg',
    'assets/images/placeholder-classroom.jpg',
    'assets/images/placeholder-classroom.jpg'
  ];
  
  scrollbarWidth: number = 20;
  scrollbarPosition: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classroomService: ClassroomService,
    private translate: TranslateService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.classroomId = this.route.snapshot.paramMap.get('id');
    if (this.classroomId) {
      this.loadClassroom();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No classroom ID provided'
      });
      this.router.navigate(['/dashboard/settings/classrooms']);
    }
  }

  ngAfterViewInit() {
    if (this.galleryScroll) {
      const scrollElement = this.galleryScroll.nativeElement;
      scrollElement.addEventListener('scroll', () => {
        this.updateScrollbar();
      });
      this.updateScrollbar();
    }
  }

  private updateScrollbar() {
    if (!this.galleryScroll) return;
    
    const scrollElement = this.galleryScroll.nativeElement;
    const scrollWidth = scrollElement.scrollWidth;
    const clientWidth = scrollElement.clientWidth;
    const scrollLeft = scrollElement.scrollLeft;
    
    if (scrollWidth > clientWidth) {
      this.scrollbarWidth = (clientWidth / scrollWidth) * 100;
      this.scrollbarPosition = (scrollLeft / scrollWidth) * 100;
    } else {
      this.scrollbarWidth = 100;
      this.scrollbarPosition = 0;
    }
  }

  private loadClassroom() {
    if (!this.classroomId) return;

    this.isLoading = true;
    this.classroomService.getClassroomById(this.classroomId).subscribe({
      next: (classroom: Classroom) => {
        this.isLoading = false;
        if (classroom) {
          this.classroom = {
            ...classroom,
            formattedEquipment: this.formatEquipment(classroom.equipment),
            formattedAvailability: this.formatAvailabilityEnum(classroom.availability)
          };
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to load classroom details'
        });
        this.router.navigate(['/dashboard/settings/classrooms']);
      }
    });
  }

  private formatEquipment(equipment: string[] | undefined): string {
    if (!equipment || equipment.length === 0) {
      return this.translate.instant('common.none');
    }
    return equipment.join(', ');
  }

  private formatAvailabilityEnum(availability: string | undefined): string {
    if (!availability) {
      return this.translate.instant('common.unknown');
    }
    
    const availabilityMap: { [key: string]: string } = {
      'available': 'settings.classrooms.availability_status.available',
      'unavailable': 'settings.classrooms.availability_status.unavailable',
      'under_maintenance': 'settings.classrooms.availability_status.under_maintenance',
      'out_of_order': 'settings.classrooms.availability_status.out_of_order'
    };
    
    return this.translate.instant(availabilityMap[availability] || availability);
  }

  onBack() {
    this.router.navigate(['/dashboard/settings/classrooms']);
  }

  onEdit() {
    if (this.classroom?.id) {
      this.router.navigate(['/dashboard/settings/classrooms/edit', this.classroom.id]);
    }
  }

  getAmenityIcon(amenity: string): string {
    const iconMap: { [key: string]: string } = {
      // Display & Presentation Equipment
      'Projector': 'pi pi-video',
      'Smart Board': 'pi pi-tablet',
      'TV/Monitor': 'pi pi-desktop',
      'Document Camera': 'pi pi-camera',
      'Whiteboard': 'pi pi-pencil',
      'Blackboard': 'pi pi-pencil',
      
      // Computer Equipment
      'Computers': 'pi pi-desktop',
      'Laptop': 'pi pi-tablet',
      'Printer': 'pi pi-print',
      'Scanner': 'pi pi-image',
      
      // Audio Equipment
      'Audio System': 'pi pi-volume-up',
      'Microphone': 'pi pi-volume-up',
      'Speakers': 'pi pi-volume-up',
      
      // Furniture
      'Tables': 'pi pi-th-large',
      'Chairs': 'pi pi-th-large',
      
      // Climate Control
      'Air Conditioning': 'pi pi-sun',
      'Heating': 'pi pi-sun',
      
      // Network & Connectivity
      'Internet Access': 'pi pi-globe',
      'WiFi': 'pi pi-wifi',
      'Ethernet Ports': 'pi pi-link',
      'Power Outlets': 'pi pi-bolt',
      
      // Specialized Equipment
      'Laboratory Equipment': 'pi pi-cog',
      'Musical Instruments': 'pi pi-star',
      'Art Supplies': 'pi pi-palette',
      'Sports Equipment': 'pi pi-stop-circle'
    };
    return iconMap[amenity] || 'pi pi-circle';
  }

  getAvailabilityClass(availability: string | undefined): string {
    if (!availability) return 'availability-unknown';
    return `availability-${availability.toLowerCase().replace('_', '-')}`;
  }

  getAmenitiesColumns(): string[][] {
    if (!this.classroom?.equipment || this.classroom.equipment.length === 0) {
      return [];
    }

    const itemsPerColumn = 5;
    const columns: string[][] = [];

    for (let i = 0; i < this.classroom.equipment.length; i += itemsPerColumn) {
      columns.push(this.classroom.equipment.slice(i, i + itemsPerColumn));
    }

    return columns;
  }

  getBranchName(): string {
    if (!this.classroom?.customer) {
      return 'Not specified';
    }

    if (typeof this.classroom.customer === 'object' && this.classroom.customer.name) {
      return this.classroom.customer.name;
    }

    return 'Not specified';
  }
}
