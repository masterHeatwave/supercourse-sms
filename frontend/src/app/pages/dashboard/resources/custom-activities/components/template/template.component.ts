import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-template',
  standalone: true,
  imports: [DropdownModule, FormsModule, CommonModule, TranslateModule],
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent implements OnInit {
  @Input() id!: number;
  singlePlayerGames = [
    {
      game: 'Blue sky',
      value: 'blueSky',
      icon: 'assets/images/custom-activities/templates/blueSkyMini.png'
    },
    {
      game: 'Exam / quiz',
      value: 'exams',
      icon: 'assets/images/custom-activities/templates/examsMini.png'
    },
    {
      game: 'Baseball',
      value: 'baseball',
      icon: 'assets/images/custom-activities/templates/baseballMini.png'
    },
    {
      game: 'Golf',
      value: 'golf',
      icon: 'assets/images/custom-activities/templates/golfMini.png'
    },
    {
      game: 'Football',
      value: 'football',
      icon: 'assets/images/custom-activities/templates/footballMini.png'
    },
    {
      game: 'Ice hockey',
      value: 'iceHockey',
      icon: 'assets/images/custom-activities/templates/iceHockeyMini.png'
    },
    {
      game: 'Tennis',
      value: 'tennis',
      icon: 'assets/images/custom-activities/templates/tennisMini.png'
    },
    {
      game: 'Beach volleyball',
      value: 'beachVolleyball',
      icon: 'assets/images/custom-activities/templates/beachVolleyballMini.png'
    },
    {
      game: 'Clouds',
      value: 'clouds',
      icon: 'assets/images/custom-activities/templates/cloudsMini.png'
    }
  ];
  multiPlayerGames = [
    {
      game: 'Blue sky',
      value: 'blueSky',
      icon: 'assets/images/custom-activities/templates/blueSkyMini.png'
    },
    {
      game: 'Ice hockey',
      value: 'iceHockey',
      icon: 'assets/images/custom-activities/templates/iceHockeyMini.png'
    },
    {
      game: 'Tennis',
      value: 'tennis',
      icon: 'assets/images/custom-activities/templates/tennisMini.png'
    },
    {
      game: 'Beach volleyball',
      value: 'beachVolleyball',
      icon: 'assets/images/custom-activities/templates/beachVolleyballMini.png'
    },
    {
      game: 'Football',
      value: 'football',
      icon: 'assets/images/custom-activities/templates/footballMini.png'
    }
  ];
  selectedGame: any;
  imageSource: string = '/assets/images/custom-activities/gamePlaceholder.png';
  @Input() template: string = '';
  @Input() selectedPlayerMode = '';

  constructor(public navigationService: NavigationService, public dataService: DataService) {}

  ngOnInit() {
    this.dataService.getPlayerMode().subscribe((pMode) => {
      this.selectedPlayerMode = pMode;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['template']) {
      this.selectedGame =
        this.singlePlayerGames.find((game) => game.value === this.template) ||
        this.multiPlayerGames.find((game) => game.value === this.template) ||
        null;

      if (this.selectedGame) {
        this.imageSource = this.selectedGame.icon.replace('Mini', '');
      }
    }
  }

  onGameChange(event: any): void {
    let newSrc = event.value.icon.replace(/Mini/, '');
    this.imageSource = newSrc;
    this.dataService.setData('template', event.value.value);
  }

  get dropdownOptions() {
    const playerMode = this.selectedPlayerMode;
    const options = playerMode === 'singlePlayer' ? this.singlePlayerGames : this.multiPlayerGames;

    if (this.selectedPlayerMode !== playerMode) {
      this.selectedPlayerMode = playerMode;
      this.selectedGame = playerMode === 'singlePlayer' ? this.singlePlayerGames[0] : this.multiPlayerGames[0];
      this.imageSource =
        playerMode === 'singlePlayer' ? this.singlePlayerGames[0].icon.replace(/Mini/, '') : this.multiPlayerGames[0].icon.replace(/Mini/, '');
    }

    return options;
  }

  private updateSelectedGame(options?: any[]) {
    if (options) {
      this.selectedGame = options[0];
    } else {
      const playerMode = this.selectedPlayerMode;
      this.selectedGame = playerMode === 'singlePlayer' ? this.singlePlayerGames[0] : this.multiPlayerGames[0];
    }
    this.imageSource = this.selectedGame.icon.replace(/Mini/, '');
  }
}
