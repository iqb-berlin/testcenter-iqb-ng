import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { FlexModule } from '@angular/flex-layout';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CdkTableModule } from '@angular/cdk/table';

import { IqbComponentsModule } from 'iqb-components';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GroupMonitorRoutingModule } from './group-monitor-routing.module';
import { GroupMonitorComponent } from './group-monitor.component';
import { BackendService } from './backend.service';
import { BookletService } from './booklet.service';
import { TestViewComponent } from './test-view/test-view.component';
import { TestSessionService } from './test-session.service';
import { GroupMonitorService } from './group-monitor.service';
import { AlertModule } from '../shared/alert/alert.module';

@NgModule({
  declarations: [
    GroupMonitorComponent,
    TestViewComponent
  ],
  imports: [
    CommonModule,
    GroupMonitorRoutingModule,
    MatTableModule,
    MatTooltipModule,
    CdkTableModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
    FlexModule,
    MatSortModule,
    MatMenuModule,
    MatButtonModule,
    MatRadioModule,
    FormsModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    IqbComponentsModule,
    AlertModule
  ],
  providers: [
    BackendService,
    BookletService,
    TestSessionService,
    GroupMonitorService
  ]
})
export class GroupMonitorModule {
}
