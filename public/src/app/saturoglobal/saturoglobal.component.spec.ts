import { ComponentFixture, TestBed } from '@angular/core/testing';

import { saturoglobalComponent } from './saturoglobal.component';

describe('saturoglobalComponent', () => {
  let component: saturoglobalComponent;
  let fixture: ComponentFixture<saturoglobalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ saturoglobalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(saturoglobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
