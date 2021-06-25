import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { IqbComponentsModule } from 'iqb-components';
import { IqbFilesUploadComponent } from './iqbFilesUpload/iqbFilesUpload.component';
import { IqbFilesUploadQueueComponent } from './iqbFilesUploadQueue/iqbFilesUploadQueue.component';
import { IqbFilesUploadInputForDirective } from './iqbFilesUploadInputFor/iqbFilesUploadInputFor.directive';

@NgModule({
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatCardModule,
    IqbComponentsModule,
    CommonModule
  ],
  declarations: [
    IqbFilesUploadComponent,
    IqbFilesUploadQueueComponent,
    IqbFilesUploadInputForDirective
  ],
  exports: [
    IqbFilesUploadQueueComponent,
    IqbFilesUploadInputForDirective
  ]
})
export class IqbFilesModule { }
