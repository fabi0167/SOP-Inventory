import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NavbarComponent } from '../navbar/navbar.component';
import { DashboardItemOverview } from '../models/dashboard-item-overview';
import { ItemGroup } from '../models/itemGroup';
import { ItemType } from '../models/itemType';
import { DashboardService } from '../services/dashboard.service';
import { ItemGroupService } from '../services/itemGroup.service';
import { ItemTypeService } from '../services/itemType.service';

@Component({
  selector: 'app-dashboard-items',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard-items.component.html',
  styleUrls: ['./dashboard-items.component.css']
})
export class DashboardItemsComponent implements OnInit, OnDestroy {
  items: DashboardItemOverview[] = [];
  itemGroups: ItemGroup[] = [];
  itemTypes: ItemType[] = [];

  isLoading = false;
  errorMessage: string | null = null;

  statusFilter: 'all' | 'functional' | 'nonfunctional' = 'all';
  selectedItemGroupId: string = '';
  selectedItemTypeId: string = '';
  searchTerm = '';

  private readonly searchChanges$ = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly itemGroupService: ItemGroupService,
    private readonly itemTypeService: ItemTypeService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.searchChanges$.pipe(debounceTime(300)).subscribe(() => this.loadItems()),
    );

    this.loadFilters();
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChanges$.next(value);
  }

  onFilterChange(): void {
    this.loadItems();
  }

  clearFilters(): void {
    this.statusFilter = 'all';
    this.selectedItemGroupId = '';
    this.selectedItemTypeId = '';
    this.searchTerm = '';
    this.loadItems();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatDate(value?: string | null): string {
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

  getStatusBadgeClass(isFunctional: boolean): string {
    return isFunctional ? 'bg-success' : 'bg-warning text-dark';
  }

  private loadFilters(): void {
    this.itemGroupService.getAll().subscribe({
      next: (groups) => this.itemGroups = groups,
      error: () => this.itemGroups = [],
    });

    this.itemTypeService.getAll().subscribe({
      next: (types) => this.itemTypes = types,
      error: () => this.itemTypes = [],
    });
  }

  private loadItems(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const itemGroupId = this.selectedItemGroupId ? Number(this.selectedItemGroupId) : null;
    const itemTypeId = this.selectedItemTypeId ? Number(this.selectedItemTypeId) : null;

    this.dashboardService.getItemsOverview({
      statusCategory: this.statusFilter,
      itemGroupId: itemGroupId || undefined,
      itemTypeId: itemTypeId || undefined,
      search: this.searchTerm,
    }).subscribe({
      next: (items) => {
        this.items = items;
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

    return 'Der opstod en fejl under hentning af genstande.';
  }
}
