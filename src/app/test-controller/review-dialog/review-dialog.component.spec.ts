import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReviewDialogData } from '../test-controller.interfaces';
import { ReviewDialogComponent } from './review-dialog.component';

describe('ReviewDialogComponent', () => {
  let component: ReviewDialogComponent;
  let fixture: ComponentFixture<ReviewDialogComponent>;

  const matDialogDataStub = <ReviewDialogData> {
    loginname: 'loginname',
    bookletname: 'bookletname',
    unitDbKey: 'unitDbKey',
    unitTitle: 'unitTitle'
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewDialogComponent],
      imports: [
        MatDialogModule,
        ReactiveFormsModule,
        MatRadioModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatCheckboxModule, MatTooltipModule,
        NoopAnimationsModule
      ],
      providers: [
        MatDialog,
        { provide: MAT_DIALOG_DATA, useValue: matDialogDataStub }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
