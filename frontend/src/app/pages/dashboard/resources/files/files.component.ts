import { Component } from '@angular/core';

import { MasterFilesComponent } from '@components/files/master-files/master-files.component';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [MasterFilesComponent],
  templateUrl: './files.component.html',
  styleUrl: './files.component.scss'
})
export class FilesComponent {

}
