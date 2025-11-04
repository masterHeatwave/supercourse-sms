import { Component } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { NavbarComponent } from "../components/navbar/navbar.component"
import { SidebarComponent } from "../components/sidebar/sidebar.component"
import { CommonModule } from "@angular/common"

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  sidebarVisible = false

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible
  }
}
