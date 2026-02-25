// src/app/risebyroots/rbr-pillars/rbr-pillars.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RbrPillar, RbrProgram, RbrService } from '../rbr.service';

@Component({
  selector: 'app-rbr-pillars',
  templateUrl: './rbr-pillars.component.html'
})
export class RbrPillarsComponent implements OnInit {
  programId!: string;
  program?: RbrProgram;
  pillars: RbrPillar[] = [];
  newPillar: Partial<RbrPillar> = {};

  constructor(private rbr: RbrService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('programId')!;
    this.loadProgramAndPillars();
  }

  loadProgramAndPillars() {
    this.rbr.getProgram(this.programId).subscribe((res) => {
      this.program = res.data;
      this.pillars = res.data.pillars;
    });
  }

  addPillar() {
    if (!this.newPillar.pillarCode || !this.newPillar.name) return;
    const payload = {
      pillarCode: this.newPillar.pillarCode!,
      name: this.newPillar.name!,
      description: this.newPillar.description || '',
      iconUrl: this.newPillar.iconUrl || '',
      totalDays: this.newPillar.totalDays || 0,
      sortOrder: this.newPillar.sortOrder || 0
    };
    this.rbr.createPillar(this.programId, payload).subscribe(() => {
      this.newPillar = {};
      this.loadProgramAndPillars();
    });
  }

  manageDays(p: RbrPillar) {
    // route like /risebyroots/programs/:programId/pillars/:pillarId/days
  }
}
