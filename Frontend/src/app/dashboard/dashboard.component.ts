import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { DashboardService } from '../services/dashboard.service';
import { DashboardSummary, DashboardStatusCount } from '../models/dashboard-summary';
import { Router } from '@angular/router';
import { Color, NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';
import { colorSets } from '@swimlane/ngx-charts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexLegend } from 'ng-apexcharts';

document.documentElement.classList.add('dark-theme');

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, NgxChartsModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  chartData: { name: string; value: number }[] = [];
  chartCustomColors = [
    { name: 'Samlet antal', value: '#0d6efd' },
    { name: 'Tilgængelige', value: '#198754' },
    { name: 'Udlånte', value: '#0dcaf0' },
    { name: 'Ikke-fungerende', value: '#ffc107' },
  ];

  pieSeries: ApexNonAxisChartSeries = [];
  pieChart: ApexChart = { type: 'pie', width: 320 };
  pieLabels: string[] = [];
  pieResponsive: ApexResponsive[] = [
   { breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }
   ];
  pieLegend: ApexLegend = { position: 'right', offsetY: 0, height: 200 };
  pieColors: string[] = [];

 

  
  chartColorScheme = {
    domain: ['#0d6efd', '#198754', '#0dcaf0', '#ffc107']
  };
   
  NgxColor: Color = colorSets.find((s) => s.name === 'cool')!;
  legendPosition: LegendPosition = LegendPosition.Right;

  chartView: [number, number] = [800, 320];


  showXAxisLabel = true;
  showYAxisLabel = true;
  xAxisLabel = 'Status';
  yAxisLabel = 'Antal genstande';

  
  

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
    yTicks: number[] = [];
    maxChartValue: number = 0;

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
    this.chartData = [
      { name: 'Samlet antal', value: summary.totalItemCount },
      { name: 'Tilgængelige', value: availableCount },
      { name: 'Udlånte', value: summary.activeLoanCount },
      { name: 'Ikke-fungerende', value: summary.nonFunctionalItemCount },
    ];

    // compute safe y-axis max and a nice step so we get ~5 grid lines
    const max = this.chartData.reduce((m, d) => Math.max(m, d.value), 0);
    const steps = 5;
    const rawStep = Math.ceil(Math.max(1, max) / steps);
    const step = Math.ceil(rawStep / 1) * 1; // adjust rounding if you want multiples of 5/10 etc.
    this.maxChartValue = step * steps;

    this.yTicks = Array.from({ length: steps + 1 }, (_, i) => i * step);

      this.pieSeries = this.chartData.map(d => d.value);
      this.pieLabels = this.chartData.map(d => d.name);
      const domain: string[] = (this.NgxColor as any)?.domain
      ?? (this.chartColorScheme as any)?.domain
      ?? this.chartCustomColors.map(c => c.value);
      this.pieColors = domain

    
  }

  
  
}
