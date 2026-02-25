// src/app/risebyroots/rbr.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RbrProgram {
  _id?: string;
  programCode: string;
  name: string;
  description?: string;
  durationDays?: number;
  format: 'digital' | 'physical' | 'hybrid';
  area: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  originalPrice: number;
  currentPrice: number;
  quantity?: number | null;
  thumbnailUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface RbrPillar {
  _id?: string;
  programId: string;
  pillarCode: string;
  name: string;
  description?: string;
  iconUrl?: string;
  totalDays?: number;
  sortOrder?: number;
}

export interface AgeGoal {
  ageBandLabel: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  goalDescription: string;
}

export interface RbrDay {
  _id?: string;
  programId: string;
  pillarId: string;
  worksheetCode: string;
  dayNumber: number;
  title: string;
  topic?: string;
  coreConcept?: string;
  instructions?: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  pdfS3Key?: string;
  extensionContent?: string;
  isPreview?: boolean;
  ageGoals: AgeGoal[];
}

@Injectable({ providedIn: 'root' })
export class RbrService {
  private basePrograms = '/api/rbr/programs';
  private baseDays = '/api/rbr/days';

  constructor(private http: HttpClient) {}

  // Programs
  getPrograms() {
    return this.http.get<{ success: boolean; data: RbrProgram[] }>(this.basePrograms);
  }

  getProgram(id: string) {
    return this.http.get<{ success: boolean; data: RbrProgram & { pillars: RbrPillar[] } }>(
      `${this.basePrograms}/${id}`
    );
  }

  createProgram(payload: RbrProgram) {
    return this.http.post(this.basePrograms, payload);
  }

  updateProgram(id: string, payload: Partial<RbrProgram>) {
    return this.http.put(`${this.basePrograms}/${id}`, payload);
  }

  // Pillars
  getPillars(programId: string) {
    return this.http.get<{ success: boolean; data: RbrPillar[] }>(
      `${this.basePrograms}/${programId}/pillars`
    );
  }

  createPillar(programId: string, payload: Omit<RbrPillar, 'programId'>) {
    return this.http.post(`${this.basePrograms}/${programId}/pillars`, payload);
  }

  // Days (admin)
  getDaysByPillar(pillarId: string) {
    return this.http.get<{ success: boolean; data: RbrDay[] }>(
      `${this.baseDays}/pillar/${pillarId}`
    );
  }

  createDay(payload: RbrDay) {
    return this.http.post(this.baseDays, payload);
  }

  updateDay(id: string, payload: Partial<RbrDay>) {
    return this.http.put(`${this.baseDays}/${id}`, payload);
  }
}
