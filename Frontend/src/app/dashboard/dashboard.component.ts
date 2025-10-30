import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { DashboardService } from '../services/dashboard.service';
import { DashboardSummary, DashboardStatusCount } from '../models/dashboard-summary';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private readonly borrowedStatusTokens = ['udlaant', 'udlaan', 'udlejet', 'loaned', 'borrowed'];

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getStatusSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.isLoading = false;
      }
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Kan ikke forbinde til serveren. Kontroller din netværksforbindelse.';
    }

    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    return 'Der opstod en fejl under hentning af dashboarddata.';
  }

  goToActiveLoans(): void {
    this.router.navigate(['/dashboard/active-loans']);
  }

  getStatusCounts(): DashboardStatusCount[] {
    if (!this.summary) {
      return [];
    }

    return this.summary.statusCounts.filter((status) => !this.isBorrowedStatus(status.status));
  }

  goToStatusItems(statusName: string): void {
    this.router.navigate(['/dashboard/status', statusName]);
  }

  trackStatusBy(_index: number, status: DashboardStatusCount): string {
    return status.status;
  }

  getStatusDisplayName(statusName: string): string {
    const normalized = statusName.trim().toLowerCase();

    if (normalized.replace(/\s+/g, '') === 'gikstykker') {
      return 'Gik i stykker';
    }

    return statusName;
  }

  private isBorrowedStatus(statusName: string): boolean {
    const normalized = this.normalizeStatusName(statusName);

    return this.borrowedStatusTokens.some((token) => normalized.includes(token));
  }

  private normalizeStatusName(statusName: string): string {
    if (!statusName) {
      return '';
    }

    return statusName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  }
}
