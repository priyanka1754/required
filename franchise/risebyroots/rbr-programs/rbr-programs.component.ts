// src/app/risebyroots/rbr-programs/rbr-programs.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RbrProgram, RbrService } from '../rbr.service';

@Component({
  selector: 'app-rbr-programs',
  templateUrl: './rbr-programs.component.html'
})
export class RbrProgramsComponent implements OnInit {
  programs: RbrProgram[] = [];
  loading = false;

  constructor(private rbr: RbrService, private router: Router) {}

  ngOnInit(): void {
    this.loadPrograms();
  }

  loadPrograms() {
    this.loading = true;
    this.rbr.getPrograms().subscribe({
      next: (res) => {
        this.programs = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  createProgram() {
    this.router.navigate(['/risebyroots/programs/new']);
  }

  editProgram(p: RbrProgram) {
    this.router.navigate(['/risebyroots/programs', p._id, 'edit']);
  }

  managePillars(p: RbrProgram) {
    this.router.navigate(['/risebyroots/programs', p._id, 'pillars']);
  }
}
