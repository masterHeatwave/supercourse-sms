import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { MasterFilesComponent } from "@components/files/master-files/master-files.component";

@Component({
  selector: 'app-master-recources',
  standalone: true,
  imports: [TabViewModule,
    TableModule,
    CardModule,
    ProgressSpinnerModule,
    CommonModule, MasterFilesComponent],
  templateUrl: './master-recources.component.html',
  styleUrl: './master-recources.component.scss'
})
export class MasterRecourcesComponent {

}
