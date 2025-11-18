import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { DashboardService } from '../services/dashboard.service';
import { DashboardSummary, DashboardStatusCount } from '../models/dashboard-summary';
import { Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  chartData: { label: string; value: number; variant: string }[] = [];
  maxChartValue = 0;

  private readonly borrowedStatusTokens = ['udlaant', 'udlaan', 'udlejet', 'loaned', 'borrowed'];
  private readonly nonFunctionalStatusTokens = ['ikke', 'defekt', 'skadet', 'service', 'reparation'];
  private readonly nonFunctionalStatusNames = new Set([
    'gikstykker',
    'skadet',
    'defekt',
    'virkerikke',
    'underservice',
    'tilreparation',
    'ireparation',
  ]);

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
        this.updateChartData(summary);
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

  goToAllItems(): void {
    this.router.navigate(['/dashboard/items']);
  }

  getStatusCounts(): DashboardStatusCount[] {
    if (!this.summary) {
      return [];
    }

    return this.summary.statusCounts.filter((status) => !this.isBorrowedStatus(status.status));
  }

  goToStatusItems(statusName: string): void {
    if (this.isBorrowedStatus(statusName)) {
      this.goToActiveLoans();
      return;
    }

    this.router.navigate(['/dashboard/status', statusName]);
  }

  goToNonFunctionalItems(): void {
    const targetStatus = this.getStatusCounts().find((status) => this.isNonFunctionalStatus(status.status));

    if (targetStatus) {
      this.goToStatusItems(targetStatus.status);
    }
  }

  hasNonFunctionalStatuses(): boolean {
    return this.getStatusCounts().some((status) => this.isNonFunctionalStatus(status.status));
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

  getBarWidth(value: number): string {
    if (this.maxChartValue === 0) {
      return '0%';
    }

    const width = (value / this.maxChartValue) * 100;
    return `${width.toFixed(1)}%`;
  }

  private isNonFunctionalStatus(statusName: string): boolean {
    const normalized = this.normalizeStatusName(statusName);

    if (this.nonFunctionalStatusNames.has(normalized)) {
      return true;
    }

    return this.nonFunctionalStatusTokens.some((token) => normalized.includes(token));
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

  private updateChartData(summary: DashboardSummary): void {
    const availableCount = Math.max(summary.totalItemCount - summary.activeLoanCount, 0);

    this.maxChartValue = Math.max(
      summary.totalItemCount,
      availableCount,
      summary.activeLoanCount,
      summary.nonFunctionalItemCount,
      1,
    );

    this.chartData = [
      { label: 'Samlet antal', value: summary.totalItemCount, variant: 'primary' },
      { label: 'Tilgængelige', value: availableCount, variant: 'success' },
      { label: 'Udlånte', value: summary.activeLoanCount, variant: 'info' },
      { label: 'Ikke-fungerende', value: summary.nonFunctionalItemCount, variant: 'warning' },
    ];
  }
}
