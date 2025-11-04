import { Component } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { ListFilesComponent } from "../list-files/list-files.component";

@Component({
  selector: 'app-master-files',
  standalone: true,
  imports: [TabViewModule, ListFilesComponent],
  templateUrl: './master-files.component.html',
  styleUrl: './master-files.component.scss'
})
export class MasterFilesComponent {

}
