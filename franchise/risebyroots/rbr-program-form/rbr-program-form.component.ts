// src/app/risebyroots/rbr-program-form/rbr-program-form.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RbrProgram, RbrService } from '../rbr.service';

@Component({
  selector: 'app-rbr-program-form',
  templateUrl: './rbr-program-form.component.html',
  standalone: true,
})
export class RbrProgramFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  programId?: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private rbr: RbrService
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.programId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.programId;

    if (this.isEdit && this.programId) {
      this.rbr.getProgram(this.programId).subscribe((res) => {
        const p = res.data;
        this.form.patchValue(p);
      });
    }
  }

  buildForm() {
    this.form = this.fb.group<RbrProgram>({
      _id: [undefined as any],
      programCode: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      durationDays: [0],
      format: ['digital', Validators.required],
      area: ['', Validators.required],
      minAgeMonths: [0, Validators.required],
      maxAgeMonths: [0, Validators.required],
      originalPrice: [0, Validators.required],
      currentPrice: [0, Validators.required],
      quantity: [null],
      thumbnailUrl: [''],
      isActive: [true],
      sortOrder: [0]
    } as any);
  }

  save() {
    if (this.form.invalid) return;

    const value = { ...this.form.value } as RbrProgram;

    if (this.isEdit && this.programId) {
      delete (value as any)._id;
      this.rbr.updateProgram(this.programId, value).subscribe(() => {
        this.router.navigate(['/risebyroots/programs']);
      });
    } else {
      this.rbr.createProgram(value).subscribe(() => {
        this.router.navigate(['/risebyroots/programs']);
      });
    }
  }

  cancel() {
    this.router.navigate(['/risebyroots/programs']);
  }
}
