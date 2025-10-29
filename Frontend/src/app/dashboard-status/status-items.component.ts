import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStatusItem } from '../models/dashboard-status-item';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-status-items',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './status-items.component.html',
  styleUrl: './status-items.component.css',
})
export class StatusItemsComponent implements OnInit, OnDestroy {
  statusName = '';
  displayName = '';
  items: DashboardStatusItem[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  searchTerm = '';

  private readonly searchChanges$ = new Subject<string>();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.searchChanges$
        .pipe(debounceTime(300))
        .subscribe(() => this.loadItems()),
    );

    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const statusParam = params.get('statusName');
        if (!statusParam) {
          return;
        }

        this.statusName = statusParam;
        this.displayName = this.getDisplayName(this.statusName);
        this.searchTerm = '';
        this.loadItems();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChanges$.next(value);
  }

  clearSearch(): void {
    if (!this.searchTerm) {
      return;
    }

    this.searchTerm = '';
    this.loadItems();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private loadItems(): void {
    if (!this.statusName) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getItemsByStatus(this.statusName, this.searchTerm).subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.isLoading = false;
      },
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Kan ikke forbinde til serveren. Kontroller din netværksforbindelse.';
    }

    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    return 'Der opstod en fejl under hentning af genstande.';
  }

  private getDisplayName(status: string): string {
    const normalized = status.trim().toLowerCase();

    if (normalized.replace(/\s+/g, '') === 'gikstykker') {
      return 'Gik i stykker';
    }

    if (normalized === 'virker') {
      return 'Virker';
    }

    return status;
  }
}
