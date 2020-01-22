import { CheckConfig } from './backend.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ServerError } from '../backend.service';

export interface ResourcePackage {
  value: string;
  tag: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  public basicTestConfig: CheckConfig = {
    id: 'Basistest',
    label: 'Basistest',
    description: 'Es wird nur ein Bericht zu grundlegenden Systemeigenschaften und zur Netzverbindung gegeben.'
  };
  public basicTestConfigData: CheckConfigData = {
    id: 'Basistest',
    label: 'Basistest',
    questions: [],
    hasunit: false,
    cansave: false,
    questionsonlymode: false,
    ratings: [],
    skipnetwork: false,
    downloadMinimum: 1024 * 1024,
    downloadGood: 1024 * 1024 * 10,
    uploadMinimum: 1024 * 512,
    uploadGood: 1024 * 1024 * 5,
    pingMinimum: 5000,
    pingGood: 1000
  };

  private serverSlimUrl_GET: string;

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {

    this.serverUrl = this.serverUrl + 'php_tc/';
    this.serverSlimUrl_GET = this.serverUrl + 'tc_get.php/';
  }

  // uppercase and add extension if not part
  // TODO there is a copy of this in testController/backendService -> move to common ancestor
  static normaliseId(s: string, standardext = ''): string {
    s = s.trim().toUpperCase();
    s.replace(/\s/g, '_');
    if (standardext.length > 0) {
      standardext = standardext.trim().toUpperCase();
      standardext.replace(/\s/g, '_');
      standardext = '.' + standardext.replace('.', '');

      if (s.slice(-(standardext.length)) !== standardext) {
        s = s + standardext;
      }
    }
    return s;
  }

  // TODO there is a copy of this in testController/backendService -> move to common ancestor
  static errorHandle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn: ServerError = null;
    if (errorObj.error instanceof ErrorEvent) {
      myreturn = new ServerError(500, 'Verbindungsproblem', (<ErrorEvent>errorObj.error).message);
    } else {
      myreturn = new ServerError(errorObj.status, 'Verbindungsproblem', errorObj.message);
      if (errorObj.status === 401) {
        myreturn.labelNice = 'Zugriff verweigert - bitte (neu) anmelden!';
      } else if (errorObj.status === 504) {
        myreturn.labelNice = 'Achtung: Server meldet Datenbankproblem.';
      }
    }
    return of(myreturn);
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getCheckConfigs(): Observable<CheckConfig[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http
      .post<CheckConfig[]>(this.serverUrl + 'getSysCheckConfigs.php', {}, httpOptions)
      .pipe(
        catchError(problem_data => {
          const myreturn: CheckConfig[] = [];
          return of(myreturn);
        })
      );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getCheckConfigData(cid: string): Observable<CheckConfigData> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http
      .post<CheckConfigData>(this.serverUrl + 'getSysCheckConfigData.php', {c: cid}, httpOptions)
        .pipe(
          catchError(problem_data => {
          const myreturn: CheckConfigData = null;
          return of(myreturn);
        })
      );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  public saveReport (cid: string, keyphrase: string, title: string, envResults: ReportEntry[], networkResults: ReportEntry[],
                     questionnaireResults: ReportEntry[], unitResults: ReportEntry[]): Observable<Boolean> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'saveSysCheckReport.php',
          {c: cid, k: keyphrase, t: title, e: envResults, n: networkResults, q: questionnaireResults, u: unitResults}, httpOptions)
        .pipe(
          catchError(problem_data => {
            return of(false);
          })
        );
  }

  // BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
  public getUnitData (configId: string): Observable<UnitData> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<UnitData>(this.serverUrl + 'getSysCheckUnitData.php', {c: configId}, httpOptions)
        .pipe(
          catchError(problem_data => {
            const myreturn: UnitData = null;
            return of(myreturn);
          })
        );
  }


  // TODO there is a copy of this in testController -> move to common service
  getResource(internalKey: string, resId: string, versionning = false): Observable<ResourcePackage | ServerError> {
    const myHttpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text' as 'json'
    };
    const urlSuffix = versionning ? '?v=1' : '';
    const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
    return this.http.get<string>(this.serverSlimUrl_GET + 'resource/' + resId + urlSuffix, myHttpOptions)
      .pipe(
        map(def => {
          return {
            tag: internalKey,
            value: def,
            duration: BackendService.getMostPreciseTimestampBrowserCanProvide() - startingTime
          };
        }),
        catchError(BackendService.errorHandle)
      );
  }


  public benchmarkDownloadRequest(requestedDownloadSize: number, KBPSReporter: BehaviorSubject<number>): Promise<NetworkRequestTestResult> {
    const fileuri = this.serverUrl + 'doSysCheckDownloadTest.php?size=' + requestedDownloadSize + '&uid=' + Date.now().toString();
    const testResult: NetworkRequestTestResult = {
      type: 'downloadTest',
      size: requestedDownloadSize,
      duration: 5000,
      error: null,
      speedInBPS: 0
    };
    return new Promise((resolve, reject) => {
      let lastTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
      let receivedBytes = 0;
      let startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
      const responseData: Array<{ bytes: number, milliseconds: number }> = [];
      this.http.get(fileuri, {
        observe: 'events',
        reportProgress: true,
        responseType: 'text'
      }).subscribe((event: HttpEvent<any>) => {
        switch (event.type) {

          case HttpEventType.Sent:
            console.log('Request sent!' + fileuri);
            // ab jetzt beginnt die Messung
            startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
            lastTime = startingTime;
            break;

          case HttpEventType.DownloadProgress:
            const currTime = BackendService.getMostPreciseTimestampBrowserCanProvide();

            const differenceBytes = event.loaded - receivedBytes;
            const timespan = currTime - lastTime;

            lastTime = currTime;
            receivedBytes = event.loaded;

            responseData.push({bytes: differenceBytes, milliseconds: timespan});
            // Nutzung von BS um aktuelle Geschwindigkeit darzustellen KB/s
            KBPSReporter.next((differenceBytes / 1024) / (timespan / 1000));
            break;

          case HttpEventType.Response:
            testResult.duration = BackendService.getMostPreciseTimestampBrowserCanProvide() - startingTime;
            const responseBytes = responseData.reduce((sum, result) => sum + result.bytes, 0);

            const responseBytesPerSecond = (responseData.reduce((sum, result) => sum + (result.bytes / (result.milliseconds / 1000)) * result.bytes, 0)) / responseBytes;


            testResult.speedInBPS = responseBytesPerSecond;
            resolve(testResult);
        }
      }, error => {
        testResult.error = `Network Error ${error.statusText} (${error.status}) `;
        resolve(testResult);
      });
    });
  }

  benchmarkUploadRequest(requestedUploadSize: number): Promise<NetworkRequestTestResult> {

    const serverUrl = this.serverUrl;
    const randomContent = BackendService.generateRandomContent(requestedUploadSize);
    const testResult: NetworkRequestTestResult = {
      type: 'uploadTest',
      size: requestedUploadSize,
      duration: 10000,
      error: null,
      speedInBPS: 0
    };

    return new Promise(function (resolve, reject) {

      const xhr = new XMLHttpRequest();
      xhr.open('POST', serverUrl + 'doSysCheckUploadTest.php', true);

      xhr.timeout = 10000;

      xhr.setRequestHeader('Content-Type', 'text/plain');

      xhr.onload = () => {

        if (xhr.status !== 200) {
          testResult.error = `Error ${xhr.statusText} (${xhr.status}) `;
        }

        const currentTime = BackendService.getMostPreciseTimestampBrowserCanProvide();
        testResult.duration = currentTime - startingTime;

        try {

          const response = JSON.parse(xhr.response);

          const arrivingSize = parseFloat(response['packageReceivedSize']);
          if (arrivingSize !== requestedUploadSize) {
            testResult.error = `Error: Data package has wrong size! ${requestedUploadSize} != ${arrivingSize}`;
          }
        } catch (e) {
          testResult.error = `bogus server response`;
        }

        console.log({ 'c': currentTime, 's': startingTime });
        resolve(testResult);

      };

      xhr.onerror = () => {
        testResult.error = `Network Error ${xhr.statusText} (${xhr.status}) `;
        resolve(testResult);
      };

      xhr.ontimeout = () => {
        testResult.duration = xhr.timeout;
        testResult.error = 'timeout';
        resolve(testResult);
      };

      const startingTime = BackendService.getMostPreciseTimestampBrowserCanProvide();

      xhr.send(randomContent);
    });
  }

  // tslint:disable-next-line:member-ordering
  private static getMostPreciseTimestampBrowserCanProvide(): number {

    if (typeof performance !== 'undefined') {
      const timeOrigin = (typeof performance.timeOrigin !== 'undefined') ? performance.timeOrigin : performance.timing.navigationStart;
      if (typeof timeOrigin !== 'undefined' && timeOrigin) {
        return timeOrigin + performance.now();
      }
    }
    return Date.now();
  }

  // tslint:disable-next-line:member-ordering
  private static generateRandomContent(length: number): string {

    const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcefghijklmnopqrstuvwxyz0123456789+/';
    let randomString = '';
    for (let i = 1; i <= length; i++) {
      const randomCharacterID = Math.floor(Math.random() * 63);
      randomString += base64Characters[randomCharacterID];
    }
    return randomString;
  }

// end of network check functions
// 7777777777777777777777777777777777777777777777777777777777777777777777

} // end of backend service

export interface CheckConfig {
  id: string;
  label: string;
  description: string;
}

export interface Rating {
  type: string;
  min: number;
  good: number;
  value: string;
}

export interface CheckConfigData {
  id: string;
  label: string;
  questions: FormDefEntry[];
  hasunit: boolean;
  cansave: boolean;
  questionsonlymode: boolean;
  ratings: Rating[];
  skipnetwork: boolean;
  uploadMinimum: number;
  uploadGood: number;
  downloadMinimum: number;
  downloadGood: number;
  pingMinimum: number;
  pingGood: number;
}

export interface FormDefEntry {
  id: string;
  type: string;
  prompt: string;
  value: string;
  options: string[];
}

export type RequestBenchmarkerFunction = (requestSize: number, callback: RequestBenchmarkerFunctionCallback) => void;
export type RequestBenchmarkerFunctionCallback = (testResult: NetworkRequestTestResult) => void;

export interface UnitData {
  key: string;
  label: string;
  def: string;
  player: string;
}

export interface NetworkRequestTestResult {
  'type': 'downloadTest' | 'uploadTest';
  'size': number;
  'duration': number;
  'error': string | null;
  'speedInBPS': number;
}

export interface ReportEntry {
  id: string;
  type: string;
  label: string;
  value: string;
}
