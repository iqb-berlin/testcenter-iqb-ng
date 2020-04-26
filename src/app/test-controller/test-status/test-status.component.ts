import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {TestControllerService} from "../test-controller.service";
import {CustomtextService} from "iqb-components";
import {UnitMenuButtonData} from "../test-controller.interfaces";
import {MainDataService} from "../../maindata.service";

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit, OnDestroy {
  unitMenuButtonList: UnitMenuButtonData[] = [];
  private routingSubscription: Subscription = null;
  private unitMenuButtonListSubscription: Subscription = null;
  flag = '';
  loginName = '??';

  constructor(
    public tcs: TestControllerService,
    public cts: CustomtextService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }
      this.routingSubscription = this.route.params.subscribe(params => {
        this.flag = params['f'];
      });
      this.unitMenuButtonList = [];
      for (let unitIndex = 0; unitIndex < this.tcs.unitListForNaviButtons.length; unitIndex++) {
        if (!this.tcs.unitListForNaviButtons[unitIndex].disabled && this.tcs.unitListForNaviButtons[unitIndex].longLabel.trim()) {
          this.unitMenuButtonList.push({
            sequenceId: this.tcs.unitListForNaviButtons[unitIndex].sequenceId,
            label: this.tcs.unitListForNaviButtons[unitIndex].longLabel,
            isCurrent: this.tcs.unitListForNaviButtons[unitIndex].isCurrent
          })
        }
      }
    })
  }

  terminateTest() {
    /*
    const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: <ConfirmDialogData>{
        title: this.cts.getCustomText('booklet_warningLeaveTestTitle'),
        content: this.cts.getCustomText('booklet_warningLeaveTestPrompt'),
        confirmbuttonlabel: 'Trotzdem weiter',
        confirmbuttonreturn: true,
        showcancel: true
      }
    });
    return dialogCDRef.afterClosed().pipe(
      switchMap(cdresult => {
          if ((typeof cdresult === 'undefined') || (cdresult === false)) {
            return of(false);
          } else {
            this.bs.addBookletLog(this.tcs.testId, Date.now(), 'BOOKLETLOCKEDbyTESTEE').pipe(
              switchMap((ok) => {
                if (!ok) {
                  console.error('failed to add log entry (locked)')
                }
                return this.bs.lockBooklet(this.tcs.testId).pipe(
                  map((ok) => {
                    if (!ok) {
                      console.error('failed to lock test')
                    }
                    return true
                  })
                )
              })
            ).subscribe((ok) => {
              if (ok) {
                localStorage.removeItem(TestControllerComponent.localStorageTestKey);
              }
              return of(ok)
            })
          }
        }
      )); */
    this.tcs.terminateTest();
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.unitMenuButtonListSubscription !== null) {
      this.unitMenuButtonListSubscription.unsubscribe();
    }
  }
}
