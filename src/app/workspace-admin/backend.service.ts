import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  GetFileResponseData, SysCheckStatistics,
  ReviewData, LogData, UnitResponse, ResultData
} from './workspace.interfaces';
import { WorkspaceDataService } from './workspacedata.service';
import { ApiError, WorkspaceData } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private wds: WorkspaceDataService,
    private http: HttpClient
  ) {
  }

  getWorkspaceData(workspaceId: string): Observable<WorkspaceData | number> {
    return this.http
      .get<WorkspaceData>(`${this.serverUrl}workspace/${workspaceId}`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getWorkspaceData Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  getFiles(): Observable<GetFileResponseData> {
    return this.http
      .get<GetFileResponseData>(`${this.serverUrl}workspace/${this.wds.wsId}/files`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getFiles Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  deleteFiles(filesToDelete: Array<string>): Observable<FileDeletionReport> {
    return this.http
      .request<FileDeletionReport>('delete', `${this.serverUrl}workspace/${this.wds.wsId}/files`, { body: { f: filesToDelete } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`deleteFiles Api-Error: ${err.code} ${err.info} `);
          return of(<FileDeletionReport> {
            deleted: [],
            not_allowed: [`deleteFiles Api-Error: ${err.code} ${err.info} `],
            did_not_exist: []
          });
        })
      );
  }

  getResultData(): Observable<ResultData[]> {
    return this.http
      .get<ResultData[]>(`${this.serverUrl}workspace/${this.wds.wsId}/results`, {})
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getResultData Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getResponses(groups: string[]): Observable<UnitResponse[]> {
    return this.http
      .get<UnitResponse[]>(`${this.serverUrl}workspace/${this.wds.wsId}/responses`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getResponses Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getLogs(groups: string[]): Observable<LogData[]> {
    return this.http
      .get<LogData[]>(`${this.serverUrl}workspace/${this.wds.wsId}/logs`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getLogs Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getReviews(groups: string[]): Observable<ReviewData[]> {
    return this.http
      .get<ReviewData[]>(`${this.serverUrl}workspace/${this.wds.wsId}/reviews`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getReviews Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  deleteData(groups: string[]): Observable<boolean> {
    return this.http
      .request('delete', `${this.serverUrl}workspace/${this.wds.wsId}/responses`, { body: { groups } })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`deleteData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getSysCheckReportList(): Observable<SysCheckStatistics[]> {
    return this.http
      .get<ReviewData[]>(`${this.serverUrl}workspace/${this.wds.wsId}/sys-check/reports/overview`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getSysCheckReportList Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  getSysCheckReport(reports: string[], enclosure: string, delimiter: string, lineEnding: string)
    : Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${this.wds.wsId}/sys-check/reports`,
        {
          params: {
            checkIds: reports.join(','),
            delimiter,
            enclosure,
            lineEnding
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getSysCheckReport Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  deleteSysCheckReports(checkIds: string[]): Observable <FileDeletionReport> {
    return this.http
      .request<FileDeletionReport>('delete', `${this.serverUrl}workspace/${this.wds.wsId}/sys-check/reports`, { body: { checkIds } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`deleteSysCheckReports Api-Error: ${err.code} ${err.info} `);
          return of(<FileDeletionReport> {
            deleted: [],
            not_allowed: [`deleteSysCheckReports Api-Error: ${err.code} ${err.info} `],
            did_not_exist: []
          });
        })
      );
  }

  getReports(type: string, ids: string[]) : Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${this.wds.wsId}/reports`,
        {
          params: {
            type,
            ids: ids.join(','),
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getReports Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  downloadFile(fileType: string, fileName: string): Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${this.wds.wsId}/file/${fileType}/${fileName}`, { responseType: 'blob' })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`downloadFile Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }
}

export interface FileDeletionReport {
  deleted: string[];
  not_allowed: string[];
  did_not_exist: string[];
  was_used: string[];
}
