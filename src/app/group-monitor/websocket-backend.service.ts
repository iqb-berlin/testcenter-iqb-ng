import {Inject, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {catchError, map, skipWhile, tap} from 'rxjs/operators';
import {ApiError} from '../app.interfaces';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {WebsocketService} from './websocket.service';

export type ConnectionStatus = "initial" | "ws-offline" | "ws-online" | "polling-sleep" | "polling-fetch" | "error";


export abstract class WebsocketBackendService<T> extends WebsocketService implements OnDestroy {

  abstract pollingEndpoint: string;
  abstract pollingInterval: number;
  abstract wsChannelName: string;
  abstract initialData: T;

  public data$: BehaviorSubject<T>;
  public connectionStatus$: BehaviorSubject<ConnectionStatus> = new BehaviorSubject<ConnectionStatus>("initial");

  private wsConnectionStatusSubscription: Subscription = null;
  private wsDataSubscription: Subscription = null;
  private pollingTimeoutId: number = null;

  protected connectionClosed: boolean = true;

  constructor(
      @Inject('SERVER_URL') protected serverUrl: string,
      protected http: HttpClient
  ) {
    super();

  }


  ngOnDestroy(): void {

    this.cutConnection();
  }


  protected subscribeEndpointAndChannel(): Observable<T> {

    if (!this.data$) {

        this.data$ = new BehaviorSubject<T>(this.initialData);
        this.pollNext();
    }
    return this.data$;
  }


  private pollNext(): void {

    this.connectionClosed = false;

    this.unsubscribeFromWebsocket();

    this.connectionStatus$.next("polling-fetch");

    this.http
        .get<T>(this.serverUrl + this.pollingEndpoint, {observe: 'response'})
        .pipe(
            catchError((err: ApiError) => {
              console.warn(`Api-Error: ${err.code} ${err.info}`);
              this.connectionStatus$.next("error");
              return of([])
            })
        )
        .subscribe((response: HttpResponse<T>) => {

          this.data$.next(response.body);

          if (response.headers.has('SubscribeURI')) {

            console.log('switch to websocket-mode');
            this.urlParam = response.headers.get('SubscribeURI');
            this.subScribeToStatusUpdateWsChannel();

          } else {

            this.connectionStatus$.next("polling-sleep");
            this.scheduleNextPoll();
          }
        });
  }


  public cutConnection(): void {

    console.log("cut monitor connection");

    this.unsubscribeFromWebsocket();
    if (this.pollingTimeoutId) {
        clearTimeout(this.pollingTimeoutId);
        this.pollingTimeoutId = null;
    }
  }


  private scheduleNextPoll(): void {

    if (this.pollingTimeoutId) {
        clearTimeout(this.pollingTimeoutId);
    }
    this.pollingTimeoutId = window.setTimeout(
        () => {if (!this.connectionClosed) this.pollNext();},
        this.pollingInterval
    );
  }


  private unsubscribeFromWebsocket() {

    if (this.wsConnectionStatusSubscription) {
        this.wsConnectionStatusSubscription.unsubscribe();
    }

    if (this.wsDataSubscription) {
        this.wsDataSubscription.unsubscribe();
    }
  }


  private subScribeToStatusUpdateWsChannel() {

    this.wsDataSubscription = this.getChannel<T>(this.wsChannelName)
        .subscribe((dataObject: T) => this.data$.next(dataObject)); // subscribe only next, not complete!

    this.wsConnectionStatusSubscription = this.serviceConnected$
        .pipe(
            skipWhile((item: boolean) => item === null), // skip pre-init-state
            tap((wsConnected: boolean) => {
              if (!wsConnected) {
                console.log('switch to polling-mode');
                this.scheduleNextPoll();
              }
            }),
            map((wsConnected: boolean): ConnectionStatus => wsConnected ? "ws-online" : "ws-offline")
        )
        .subscribe(this.connectionStatus$);
  }
}