import { EditworkspaceComponent } from './editworkspace/editworkspace.component';
import { NewworkspaceComponent } from './newworkspace/newworkspace.component';
import { BackendService } from '../backend.service';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmDialogComponent, ConfirmDialogData,
  MessageDialogComponent, MessageDialogData, MessageType
} from 'iqb-components';
import { MainDataService } from 'src/app/maindata.service';
import {IdAndName, IdRoleData} from "../superadmin.interfaces";

@Component({
  templateUrl: './workspaces.component.html',
  styleUrls: ['./workspaces.component.css']
})
export class WorkspacesComponent implements OnInit {
  public objectsDatasource: MatTableDataSource<IdAndName>;
  public displayedColumns = ['selectCheckbox', 'name'];
  private tableselectionCheckbox = new SelectionModel <IdAndName>(true, []);
  private tableselectionRow = new SelectionModel <IdAndName>(false, []);
  public selectedWorkspaceId = 0;
  private selectedWorkspaceName = '';
  private pendingUserChanges = false;
  public UserlistDatasource: MatTableDataSource<IdRoleData>;
  public displayedUserColumns = ['selectCheckbox', 'name'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bs: BackendService,
    private mds: MainDataService,
    private newworkspaceDialog: MatDialog,
    private editworkspaceDialog: MatDialog,
    private deleteConfirmDialog: MatDialog,
    private messsageDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tableselectionRow.changed.subscribe(
      r => {
        if (r.added.length > 0) {
          this.selectedWorkspaceId = r.added[0].id;
          this.selectedWorkspaceName = r.added[0].name;
        } else {
          this.selectedWorkspaceId = 0;
          this.selectedWorkspaceName = '';
          }
        this.updateUserList();
      });
  }

  ngOnInit() {
    setTimeout(() => {
      this.updateObjectList();
    })
  }

  // ***********************************************************************************
  addObject() {
    const dialogRef = this.newworkspaceDialog.open(NewworkspaceComponent, {
      width: '600px',
      data: {
        name: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (typeof result !== 'undefined') {
        if (result !== false) {
          this.mds.incrementDelayedProcessesCount();
          this.bs.addWorkspace((<FormGroup>result).get('name').value).subscribe(
            respOk => {
              if (respOk !== false) {
                this.snackBar.open('Arbeitsbereich hinzugefügt', '', {duration: 1000});
                this.updateObjectList();
              } else {
                this.snackBar.open('Konnte Arbeitsbereich nicht hinzufügen', 'Fehler', {duration: 1000});
              }
              this.mds.decrementDelayedProcessesCount();
            });
        }
      }
    });
  }

  changeObject() {
    let selectedRows = this.tableselectionRow.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionCheckbox.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Arbeitsbereich ändern',
          content: 'Bitte markieren Sie erst einen Arbeitsbereich!',
          type: MessageType.error
        }
      });
    } else {
      const dialogRef = this.editworkspaceDialog.open(EditworkspaceComponent, {
        width: '600px',
        data: selectedRows[0].name
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            this.mds.incrementDelayedProcessesCount();
            this.bs.renameWorkspace(selectedRows[0].id,
                (<FormGroup>result).get('name').value).subscribe(
                  respOk => {
                    if (respOk !== false) {
                      this.snackBar.open('Arbeitsbereich geändert', '', {duration: 1000});
                      this.updateObjectList();
                    } else {
                      this.snackBar.open('Konnte Arbeitsbereich nicht ändern', 'Fehler', {duration: 2000});
                    }
                    this.mds.decrementDelayedProcessesCount();
                  });
          }
        }
      });
    }
  }

  deleteObject() {
    let selectedRows = this.tableselectionCheckbox.selected;
    if (selectedRows.length === 0) {
      selectedRows = this.tableselectionRow.selected;
    }
    if (selectedRows.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Löschen von Arbeitsbereichen',
          content: 'Bitte markieren Sie erst Arbeitsbereich/e!',
          type: MessageType.error
        }
      });
    } else {
      let prompt = 'Soll';
      if (selectedRows.length > 1) {
        prompt = prompt + 'en ' + selectedRows.length + ' Arbeitsbereiche ';
      } else {
        prompt = prompt + ' Arbeitsbereich "' + selectedRows[0].name + '" ';
      }
      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Arbeitsbereichen',
          content: prompt + 'gelöscht werden?',
          confirmbuttonlabel: 'Arbeitsbereich/e löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.mds.incrementDelayedProcessesCount();
          const workspacesToDelete = [];
          selectedRows.forEach((r: IdAndName) => workspacesToDelete.push(r.id));
          this.bs.deleteWorkspaces(workspacesToDelete).subscribe(
            respOk => {
              if (respOk !== false) {
                this.snackBar.open('Arbeitsbereich/e gelöscht', '', {duration: 1000});
                this.updateObjectList();
              } else {
                this.snackBar.open('Konnte Arbeitsbereich/e nicht löschen', 'Fehler', {duration: 1000});
              }
              this.mds.decrementDelayedProcessesCount();
          });
        }
      });
    }
  }

  // ***********************************************************************************
  updateUserList() {
    this.pendingUserChanges = false;
    if (this.selectedWorkspaceId > 0) {
      this.mds.incrementDelayedProcessesCount();
      this.bs.getUsersByWorkspace(this.selectedWorkspaceId).subscribe(dataresponse => {
        this.UserlistDatasource = new MatTableDataSource(dataresponse);
        this.mds.decrementDelayedProcessesCount();
      });
    } else {
      this.UserlistDatasource = null;
    }
  }

  selectUser(ws: IdRoleData, role: string) {
    if (ws.role === role) {
      ws.role = '';
    } else {
      ws.role = role;
    }
    this.pendingUserChanges = true;
  }

  saveUsers() {
    this.pendingUserChanges = false;
    if (this.selectedWorkspaceId > 0) {
      this.mds.incrementDelayedProcessesCount();
      this.bs.setUsersByWorkspace(this.selectedWorkspaceId, this.UserlistDatasource.data).subscribe(
        respOk => {
          if (respOk !== false) {
            this.snackBar.open('Zugriffsrechte geändert', '', {duration: 1000});
          } else {
            this.snackBar.open('Konnte Zugriffsrechte nicht ändern', 'Fehler', {duration: 2000});
          }
          this.mds.decrementDelayedProcessesCount();
        });
    } else {
      this.UserlistDatasource = null;
    }
  }

  // ***********************************************************************************
  updateObjectList() {
    this.mds.incrementDelayedProcessesCount();
    this.bs.getWorkspaces().subscribe(dataresponse => {
      this.objectsDatasource = new MatTableDataSource(dataresponse);
      this.objectsDatasource.sort = this.sort;
      this.tableselectionCheckbox.clear();
      this.tableselectionRow.clear();
      this.mds.decrementDelayedProcessesCount();
    });
  }

  isAllSelected() {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.objectsDatasource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.tableselectionCheckbox.clear() :
        this.objectsDatasource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  selectRow(row) {
    this.tableselectionRow.select(row);
  }
}
