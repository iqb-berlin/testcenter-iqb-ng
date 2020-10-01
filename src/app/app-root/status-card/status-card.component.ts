import {Component, Inject, OnInit} from '@angular/core';
import {MainDataService} from '../../maindata.service';
import {AuthAccessKeyType, AuthFlagType} from '../../app.interfaces';

@Component({
  selector: 'status-card',
  templateUrl: './status-card.component.html'
})
export class StatusCardComponent implements OnInit {
  loginName = '';
  loginAuthority: string[] = [];

  constructor(
    @Inject('APP_NAME') public appName: string,
    @Inject('APP_PUBLISHER') public appPublisher: string,
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('API_VERSION_EXPECTED') public apiVersionExpected: string,
    @Inject('VERONA_API_VERSION_SUPPORTED') public veronaApiVersionSupported: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
        if (authData.access[AuthAccessKeyType.WORKSPACE_ADMIN]) {
          this.loginAuthority.push('Verwaltung von Testinhalten');
        }
        if (authData.access[AuthAccessKeyType.SUPER_ADMIN]) {
          this.loginAuthority.push('Verwaltung von Nutzerrechten und von grundsätzlichen Systemeinstellungen');
        }
        if (authData.access[AuthAccessKeyType.TEST]) {
          if (authData.access[AuthAccessKeyType.TEST].length > 1) {
            this.loginAuthority.push('Ausführung/Ansicht von Befragungen oder Testheften');
          } else {
            this.loginAuthority.push('Ausführung/Ansicht einer Befragung oder eines Testheftes');
          }
        }
        if (authData.access[AuthAccessKeyType.WORKSPACE_MONITOR]) {
          if (authData.access[AuthAccessKeyType.WORKSPACE_MONITOR].length > 1) {
            this.loginAuthority.push('Beobachtung/Prüfung der Durchführung von Befragungen oder Kompetenztests');
          } else {
            this.loginAuthority.push('Beobachtung/Prüfung der Durchführung einer Befragung oder eines Kompetenztests');
          }
        }
        if (authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR]) {
          this.loginAuthority.push('Beobachtung/Prüfung einer Testgruppe');
        }
        if (authData.flags.indexOf(AuthFlagType.CODE_REQUIRED) >= 0) {
          this.loginAuthority.push('Code-Eingabe erforderlich');
        }
      }
    });
  }

}
