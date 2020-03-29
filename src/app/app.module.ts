import { AboutComponent } from './app-root/about/about.component';
import { BrowserModule } from '@angular/platform-browser';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {ApplicationModule, NgModule} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BackendService } from './backend.service';
import { StartComponent } from './start/start.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {AuthInterceptor} from './app.interceptor';
import { IqbComponentsModule } from 'iqb-components';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatMenuModule} from "@angular/material/menu";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatRadioModule} from "@angular/material/radio";
import {MatTabsModule} from "@angular/material/tabs";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatTooltipModule} from "@angular/material/tooltip";
import {RouterModule} from "@angular/router";
import { AppRootComponent } from './app-root/app-root.component';
import { SysCheckStarterComponent } from './app-root/sys-check-starter/sys-check-starter.component';
import { LoginComponent } from './app-root/login/login.component';
import { CodeInputComponent } from './app-root/code-input/code-input.component';
import { AdminStarterComponent } from './app-root/admin-starter/admin-starter.component';
import { RouteDispatcherComponent } from './app-root/route-dispatcher/route-dispatcher.component';
import { StatusCardComponent } from './app-root/status-card/status-card.component';
import { TestStarterComponent } from './app-root/test-starter/test-starter.component';



@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    AboutComponent,
    AppRootComponent,
    SysCheckStarterComponent,
    LoginComponent,
    CodeInputComponent,
    AdminStarterComponent,
    RouteDispatcherComponent,
    StatusCardComponent,
    TestStarterComponent
  ],
  imports: [
    ApplicationModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    IqbComponentsModule.forRoot()
  ],
  providers: [
    BackendService,
    MatDialog,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
