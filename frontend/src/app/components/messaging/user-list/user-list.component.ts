import { Component, OnInit } from '@angular/core';
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service'; 
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = true;

  constructor(private api: MessagingWrapperService) {}

  ngOnInit() {
   
  
  }
    
}