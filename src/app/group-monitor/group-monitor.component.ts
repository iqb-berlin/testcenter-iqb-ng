import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatSidenav } from '@angular/material/sidenav';
import { interval, Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData, CustomtextService } from 'iqb-components';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { switchMap } from 'rxjs/operators';
import { BackendService } from './backend.service';
import {
  GroupData,
  TestViewDisplayOptions,
  TestViewDisplayOptionKey, Selection, TestSession, TestSessionSetStats, CommandResponse, UIMessage
} from './group-monitor.interfaces';
import { ConnectionStatus } from '../shared/websocket-backend.service';
import { GroupMonitorService } from './group-monitor.service';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {
  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private bs: BackendService, // TODO move completely to service
    public gms: GroupMonitorService,
    private router: Router,
    private cts: CustomtextService
  ) {}

  ownGroup$: Observable<GroupData>;
  private ownGroupName = '';

  connectionStatus$: Observable<ConnectionStatus>;

  selectedElement: Selection;
  markedElement: Selection;

  displayOptions: TestViewDisplayOptions = {
    view: 'medium',
    groupColumn: 'hide',
    bookletColumn: 'show',
    blockColumn: 'show',
    unitColumn: 'hide',
    highlightSpecies: false,
    manualChecking: false
  };

  isScrollable = false;
  isClosing = false;

  messages: UIMessage[] = [];

  private routingSubscription: Subscription = null;

  @ViewChild('adminbackground') mainElem:ElementRef;
  @ViewChild('sidenav', { static: true }) sidenav: MatSidenav;

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.ownGroup$ = this.bs.getGroupData(params['group-name']);
      this.ownGroupName = params['group-name'];
      this.gms.connect(params['group-name']);
    });
    this.gms.sessionsStats$.subscribe(stats => {
      this.onSessionsUpdate(stats);
    });
    this.gms.checkedStats$.subscribe(stats => {
      this.onCheckedChange(stats);
    });
    this.connectionStatus$ = this.bs.connectionStatus$;
    this.gms.commandResponses$.subscribe(commandResponse => {
      this.messages.push(this.commandResponseToMessage(commandResponse));
    });
    this.gms.commandResponses$
      .pipe(switchMap(() => interval(2000)))
      .subscribe(() => this.messages.shift());
  }

  private commandResponseToMessage(commandResponse: CommandResponse): UIMessage {
    if (!commandResponse.testIds.length) {
      return {
        level: 'warning',
        text: `No Sessions affected by \`${commandResponse.commandType}\``
      };
    }
    return {
      level: 'info',
      text: `Sent \`${commandResponse.commandType}\` to \`${commandResponse.testIds.length}\` sessions`
    };
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.gms.disconnect();
  }

  ngAfterViewChecked(): void {
    this.isScrollable = this.mainElem.nativeElement.clientHeight < this.mainElem.nativeElement.scrollHeight;
  }

  private onSessionsUpdate(stats: TestSessionSetStats): void {
    this.displayOptions.highlightSpecies = (stats.differentBookletSpecies > 1);

    if (!this.gms.checkingOptions.disableAutoCheckAll) {
      this.displayOptions.manualChecking = true;
    }
  }

  private onCheckedChange(stats: TestSessionSetStats): void {
    if (stats.differentBookletSpecies > 1) {
      this.selectedElement = null;
    }
  }

  trackSession = (index: number, session: TestSession): number => session.id;

  setTableSorting(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.gms.sortBy$.next(sort);
  }

  setDisplayOption(option: string, value: TestViewDisplayOptions[TestViewDisplayOptionKey]): void {
    this.displayOptions[option] = value;
  }

  scrollDown(): void {
    this.mainElem.nativeElement.scrollTo(0, this.mainElem.nativeElement.scrollHeight);
  }

  updateScrollHint(): void {
    const elem = this.mainElem.nativeElement;
    const reachedBottom = (elem.scrollTop + elem.clientHeight === elem.scrollHeight);
    elem.classList[reachedBottom ? 'add' : 'remove']('hide-scroll-hint');
  }

  getClusterColor(session: TestSession): string {
    if (!this.displayOptions.highlightSpecies) {
      return 'white';
    }
    const species = session.booklet.species;
    const q1 = species.length / 4;
    const q2 = species.length / 2;
    const q3 = 3 * (species.length / 4);
    const end = species.length - 1;
    const cnn = species.length * (species.charCodeAt(0) + species.charCodeAt(q1) +
      species.charCodeAt(q2) + species.charCodeAt(q3) + species.charCodeAt(end));
    const rgb = [255, 255, 255];
    rgb[species.charCodeAt(end) % 3] = (cnn % 150);
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]}, 0.07)`;
  }

  markElement(marking: Selection): void {
    this.markedElement = marking;
  }

  selectElement(selected: Selection): void {
    this.gms.checkSessionsBySelection(selected);
    this.selectedElement = selected;
  }

  finishEverythingCommand(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'auto',
      data: <ConfirmDialogData>{
        title: 'Testdurchführung Beenden',
        content: 'Achtung! Diese Aktion sperrt und beendet sämtliche Tests dieser Sitzung.',
        confirmbuttonlabel: 'Ja, ich möchte die Testdurchführung Beenden',
        showcancel: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isClosing = true;
        this.gms.finishEverything()
          .add(() => {
            setTimeout(() => { this.router.navigateByUrl('/r/login'); }, 5000); // go away
          });
      }
    });
  }

  testCommandGoto(): void {
    this.gms.testCommandGoto(this.selectedElement);
  }

  unlockCommand(): void {
    this.gms.testCommandUnlock();
    //   .subscribe(commandResponse => {
    //     if (commandResponse.error) {
    //       const plural = this.gms.sessions.length > 1;
    //       this.addWarning('reload-some-clients',
    //         `${plural ? this.gms.sessions.length : 'Ein'} Test${plural ? 's' : ''}
    //       wurde${plural ? 'n' : ''} entsperrt. ${plural ? 'Die' : 'Der'} Teilnehmer
    //       ${plural ? 'müssen' : 'muss'} die Webseite aufrufen bzw. neuladen,
    //       damit ${plural ? 'die' : 'der'} Test${plural ? 's' : ''} wieder aufgenommen werden
    //       ${plural ? 'können' : 'kann'}!`);
    //     }
    //   });
  }

  toggleChecked(checked: boolean, session: TestSession): void {
    if (!this.gms.isChecked(session)) {
      this.gms.checkSession(session);
    } else {
      this.gms.uncheckSession(session);
    }
  }

  invertChecked(event: Event): boolean {
    event.preventDefault();
    this.gms.invertChecked();
    return false;
  }

  toggleAlwaysCheckAll(event: MatSlideToggleChange): void {
    if (this.gms.checkingOptions.disableAutoCheckAll && !event.checked) {
      this.gms.checkAll();
      this.displayOptions.manualChecking = false;
      this.gms.checkingOptions.autoCheckAll = true;
    } else {
      this.gms.checkNone();
      this.displayOptions.manualChecking = true;
      this.gms.checkingOptions.autoCheckAll = false;
    }
  }

  toggleCheckAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.gms.checkAll();
    } else {
      this.gms.checkNone();
    }
  }
}
