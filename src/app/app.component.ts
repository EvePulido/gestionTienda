import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

// 1. Importa 'addIcons' y los iconos que necesitas
import { addIcons } from 'ionicons';
import {
  homeOutline,
  cubeOutline,
  peopleOutline,
  cartOutline,
  analyticsOutline,
  logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true, // <-- ¡Esto es clave! Faltaba esta línea.
  imports: [IonApp, IonRouterOutlet], // Esto permite usar <ion-app> y <ion-router-outlet> en tu HTML
})
export class AppComponent {
  constructor() {
    // 2. Llama a addIcons en el constructor para registrarlos
    addIcons({
      homeOutline,
      cubeOutline,
      peopleOutline,
      cartOutline,
      analyticsOutline,
      logOutOutline
    });
  }
}