import { Injectable } from '@angular/core';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { Classroom, PostClassroomsBody, PutClassroomsIdBody, ClassroomType } from '@gen-api/schemas';
import { Observable, map, switchMap, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectCurrentCustomerId } from '@store/auth/auth.selectors';

export interface ClassroomWithFormatted extends Omit<Classroom, 'customer' | 'type'> {
  formattedEquipment: string;
  formattedAvailability: string;
  customer?: {
    id: string;
    name: string;
  } | string;
  type?: ClassroomType | string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {
  constructor(
    private classroomsService: ClassroomsService,
    private store: Store<AppState>
  ) {}

  /**
   * Get all classrooms for the current branch
   */
  getAllClassrooms(): Observable<ClassroomWithFormatted[]> {
    return this.store.select(selectCurrentCustomerId).pipe(
      switchMap((customerId) => {
        console.log('Loading classrooms for customer ID:', customerId);
        
        // TODO: Once the API supports customer filtering, add customerId to the parameters
        // For now, we'll fetch all classrooms and filter on the frontend if needed
        return this.classroomsService.getClassrooms<any>().pipe(
          map((response: any) => {
            if (!response || !response.data) {
              return [];
            }
            
            return response.data.map((classroom: Classroom) => ({
              ...classroom,
              formattedEquipment: this.formatEquipment(classroom.equipment),
              formattedAvailability: this.formatAvailabilityEnum(classroom.availability)
            }));
          })
        );
      })
    );
  }

  /**
   * Get paginated classrooms
   */
  getClassroomsPaginated(
    page: number,
    limit: number,
    search?: string
  ): Observable<{ classrooms: ClassroomWithFormatted[]; totalResults: number }> {
    const params: any = { page: String(page), limit: String(limit) };
    if (search && search.trim()) {
      params.search = search.trim();
    }

    return this.classroomsService.getClassrooms<any>(params, { params }).pipe(
      map((response: any) => {
        const classroomsArray = response?.data?.results ?? response?.data ?? [];
        const totalResults = response?.data?.totalResults ?? response?.count ?? (Array.isArray(classroomsArray) ? classroomsArray.length : 0);
        const formatted = (classroomsArray as Classroom[]).map((classroom: Classroom) => ({
          ...classroom,
          formattedEquipment: this.formatEquipment(classroom.equipment),
          formattedAvailability: this.formatAvailabilityEnum(classroom.availability)
        }));
        return { classrooms: formatted, totalResults };
      })
    );
  }

  /**
   * Get a specific classroom by ID
   */
  getClassroomById(id: string): Observable<Classroom> {
    return this.classroomsService.getClassroomsId<any>(id).pipe(
      map((response: any) => response?.data || null)
    );
  }

  /**
   * Create a new classroom
   */
  createClassroom(classroomData: PostClassroomsBody) {
    return this.classroomsService.postClassrooms(classroomData);
  }

  /**
   * Update an existing classroom
   */
  updateClassroom(id: string, classroomData: Omit<PutClassroomsIdBody, 'id'>) {
    const updateData: PutClassroomsIdBody = {
      id: id,
      ...classroomData
    };
    return this.classroomsService.putClassroomsId(id, updateData);
  }

  /**
   * Delete a classroom
   */
  deleteClassroom(id: string) {
    return this.classroomsService.deleteClassroomsId(id);
  }

  /**
   * Format equipment array for display
   */
  private formatEquipment(equipment?: string[]): string {
    if (!equipment || equipment.length === 0) {
      return 'None';
    }
    return equipment.join(', ');
  }

  /**
   * Format availability enum for display
   */
  private formatAvailabilityEnum(availability?: string): string {
    switch (availability) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'out_of_order':
        return 'Out of Order';
      case 'under_maintenance':
        return 'Under Maintenance';
      default:
        return 'Unknown';
    }
  }

  // Removed searchClassrooms: server-side search is used with pagination
}
