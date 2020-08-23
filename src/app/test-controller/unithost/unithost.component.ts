import { MainDataService } from '../../maindata.service';
import { TestControllerService } from '../test-controller.service';
import { Subscription} from 'rxjs';
import {Component, HostListener, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OnDestroy } from '@angular/core';
import {TaggedString, PageData, LastStateKey, LogEntryKey, KeyValuePairString} from '../test-controller.interfaces';

declare var srcDoc: any;

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private routingSubscription: Subscription = null;
  public leaveWarning = false;

  public unitTitle = '';
  public showPageNav = false;

  private myUnitSequenceId = -1;
  private myUnitDbKey = '';

  private postMessageSubscription: Subscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitDefinition: TaggedString = null;
  private pendingUnitRestorePoint: TaggedString = null;

  public pageList: PageData[] = [];
  private knownPages: string[];


  constructor(
    public tcs: TestControllerService,
    private mds: MainDataService,
    private route: ActivatedRoute
  ) {  }

  ngOnInit() {
    setTimeout(() => {
      this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
        const msgData = m.data;
        const msgType = msgData['type'];
        let msgPlayerId = msgData['sessionId'];
        if ((msgPlayerId === undefined) || (msgPlayerId === null)) {
          msgPlayerId = this.itemplayerSessionId;
        }

        if ((msgType !== undefined) && (msgType !== null)) {
          switch (msgType) {
            case 'vopReadyNotification':
              // TODO add apiVersion check
              let pendingUnitDef = '';
              if (this.pendingUnitDefinition !== null) {
                if (this.pendingUnitDefinition.tag === msgPlayerId) {
                  pendingUnitDef = this.pendingUnitDefinition.value;
                  this.pendingUnitDefinition = null;
                }
              }

              let pendingUnitDataToRestore: KeyValuePairString = {};
              if (this.pendingUnitRestorePoint !== null) {
                if (this.pendingUnitRestorePoint.tag === msgPlayerId) {
                  pendingUnitDataToRestore['all'] = this.pendingUnitRestorePoint.value;
                  this.pendingUnitRestorePoint = null;
                }
              }
              this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONSTART, '#first');

              this.postMessageTarget = m.source as Window;
              if (typeof this.postMessageTarget !== 'undefined') {
                this.postMessageTarget.postMessage({
                  type: 'vopStartCommand',
                  sessionId: this.itemplayerSessionId,
                  unitDefinition: pendingUnitDef,
                  unitState: {
                    dataParts: pendingUnitDataToRestore
                  },
                  playerConfig: {
                    logPolicy: 'eager' // 'debug'
                  }
                }, '*');
              }
              break;

            case 'vopStateChangedNotification':
              if (msgPlayerId === this.itemplayerSessionId) {
                if (msgData['playerState']) {
                  const playerState = msgData['playerState'];
                  this.setPageList(Object.keys(playerState.validPages), playerState.currentPage);
                  if (playerState['currentPage'] !== undefined) {
                    this.updateUnitStatePage(msgData['currentPage']);
                    this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONCOMPLETE, playerState['currentPage']);
                  }
                }
                if (msgData['unitState']) {
                  const unitState = msgData['unitState'];
                  const presentationProgress = unitState['presentationProgress'];
                  if (presentationProgress) {
                    this.tcs.newUnitStatePresentationProgress(this.myUnitDbKey, this.myUnitSequenceId, presentationProgress);
                  }
                  const responseProgress = unitState['responseProgress'];
                  if (responseProgress) {
                    this.tcs.newUnitStateResponseProgress(this.myUnitDbKey, this.myUnitSequenceId, responseProgress);
                  }
                  const unitData = unitState['dataParts'];
                  if (unitData) {
                    const dataPartsAllString = unitData['all'];
                    if (dataPartsAllString) {
                      this.tcs.newUnitStateData(this.myUnitDbKey, this.myUnitSequenceId, dataPartsAllString,
                        unitState['unitStateDataType'])
                    }
                  }
                }
              }
              break;

            case 'vopUnitNavigationRequestedNotification':
              if (msgPlayerId === this.itemplayerSessionId) {
                this.tcs.setUnitNavigationRequest(msgData['targetRelative']);
              }
              break;

            default:
              console.log('processMessagePost ignored message: ' + msgType);
              break;
          }
        }
      });

      this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

      this.iFrameItemplayer = null;
      this.leaveWarning = false;

      this.routingSubscription = this.route.params.subscribe(params => {
        this.myUnitSequenceId = Number(params['u']);
        this.tcs.currentUnitSequenceId = this.myUnitSequenceId;

        while (this.iFrameHostElement.hasChildNodes()) {
          this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
        }

        if ((this.myUnitSequenceId >= 1) && (this.myUnitSequenceId === this.myUnitSequenceId) && (this.tcs.rootTestlet !== null)) {
          this.tcs.setBookletState(LastStateKey.LASTUNIT, params['u']);

          const currentUnit = this.tcs.rootTestlet.getUnitAt(this.myUnitSequenceId);
          this.unitTitle = currentUnit.unitDef.title;
          this.myUnitDbKey = currentUnit.unitDef.alias;
          this.tcs.currentUnitDbKey = this.myUnitDbKey;
          this.tcs.currentUnitTitle = this.unitTitle;
          this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

          this.setPageList([], '');

          this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
          // this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(currentUnit.unitDef.playerId));
          this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
          this.iFrameItemplayer.setAttribute('class', 'unitHost');
          this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight - 5));

          if (this.tcs.hasUnitStateData(this.myUnitSequenceId)) {
            this.pendingUnitRestorePoint = {tag: this.itemplayerSessionId, value: this.tcs.getUnitStateData(this.myUnitSequenceId)};
          } else {
            this.pendingUnitRestorePoint = null;
          }

          this.leaveWarning = false;

          if (this.tcs.hasUnitDefinition(this.myUnitSequenceId)) {
            this.pendingUnitDefinition = {tag: this.itemplayerSessionId, value: this.tcs.getUnitDefinition(this.myUnitSequenceId)};
          } else {
            this.pendingUnitDefinition = null;
          }
          this.iFrameHostElement.appendChild(this.iFrameItemplayer);
          srcDoc.set(this.iFrameItemplayer, this.tcs.getPlayer(currentUnit.unitDef.playerId));
        }
      });
    });
  }

  @HostListener('window:resize')
  public onResize(): any {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      const divHeight = this.iFrameHostElement.clientHeight;
      this.iFrameItemplayer.setAttribute('height', String(divHeight - 5));
      // TODO: Why minus 5px?
    }
  }

  setPageList(validPages: string[], currentPage: string) {
    if ((validPages instanceof Array)) {
      this.knownPages = validPages.length ? validPages : [];
      const newPageList: PageData[] = [];
      if (validPages.length > 1) {
        for (let i = 0; i < validPages.length; i++) {
          if (i === 0) {
            newPageList.push({
              index: -1,
              id: '#previous',
              disabled: validPages[i] === currentPage,
              type: '#previous'
            });
          }

          newPageList.push({
            index: i + 1,
            id: validPages[i],
            disabled: validPages[i] === currentPage,
            type: '#goto'
          });

          if (i === validPages.length - 1) {
            newPageList.push({
              index: -1,
              id: '#next',
              disabled: validPages[i] === currentPage,
              type: '#next'
            });
          }
        }
      }
      this.pageList = newPageList;

    } else if ((this.pageList.length > 1) && (currentPage !== undefined)) {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if (this.pageList[i].type === '#goto') {
          if (this.pageList[i].id === currentPage) {
            this.pageList[i].disabled = true;
            currentPageIndex = i;
          } else {
            this.pageList[i].disabled = false;
          }
        }
      }
      if (currentPageIndex === 1) {
        this.pageList[0].disabled = true;
        this.pageList[this.pageList.length - 1].disabled = false;
      } else {
        this.pageList[0].disabled = false;
        this.pageList[this.pageList.length - 1].disabled = currentPageIndex === this.pageList.length - 2;
      }
    }
    this.showPageNav = this.pageList.length > 0;
  }

  gotoPage(action: string, index = 0) {
    let nextPageId = '';
    // currentpage is detected by disabled-attribute of page
    if (action === '#next') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if ((currentPageIndex > 0) && (currentPageIndex < this.pageList.length - 2)) {
        nextPageId = this.pageList[currentPageIndex + 1].id;
      }
    } else if (action === '#previous') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if (currentPageIndex > 1) {
        nextPageId = this.pageList[currentPageIndex - 1].id;
      }
    } else if (action === '#goto') {
      if ((index > 0) && (index < this.pageList.length - 1)) {
        nextPageId = this.pageList[index].id;
      }
    } else if (index === 0) {
      // call from player
      nextPageId = action;
    }

    if (nextPageId.length > 0) {
      this.tcs.addUnitLog(this.myUnitDbKey, LogEntryKey.PAGENAVIGATIONSTART, nextPageId);
      if (typeof this.postMessageTarget !== 'undefined') {
        this.postMessageTarget.postMessage({
          type: 'vopPageNavigationCommand',
          sessionId: this.itemplayerSessionId,
          target: nextPageId
        }, '*');
      }
    }
  }

  private updateUnitStatePage(newPage: string) {
    if (this.knownPages.length > 1) {
      this.tcs.newUnitStatePage(this.myUnitDbKey, newPage,
          this.knownPages.indexOf(newPage) + 1, this.knownPages.length);
    }
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.postMessageSubscription !== null) {
      this.postMessageSubscription.unsubscribe();
    }
  }
}
