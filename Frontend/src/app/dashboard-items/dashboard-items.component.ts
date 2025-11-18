import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ItemService } from '../services/item.service';
import { Item } from '../models/item';

interface DashboardItemRow {
  item: Item;
  latestStatus: string;
  itemGroupName: string;
  itemTypeName: string;
  itemGroupId?: number;
  itemTypeId?: number;
}

interface GroupOption {
  id: number;
  name: string;
}

interface TypeOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-dashboard-items',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard-items.component.html',
  styleUrls: ['./dashboard-items.component.css']
})
export class DashboardItemsComponent implements OnInit {
  rows: DashboardItemRow[] = [];
  filteredRows: DashboardItemRow[] = [];

  statusOptions: string[] = [];
  groupOptions: GroupOption[] = [];
  typeOptions: TypeOption[] = [];

  statusFilter = 'alle';
  groupFilter: number | 'alle' = 'alle';
  typeFilter: number | 'alle' = 'alle';
  searchTerm = '';

  isLoading = false;
  errorMessage: string | null = null;

  constructor(private itemService: ItemService, private router: Router) { }

  ngOnInit(): void {
    this.fetchItems();
  }

  fetchItems(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.itemService.getAll().subscribe({
      next: (items) => {
        this.rows = items.map((item) => this.mapToRow(item));
        this.buildFilterOptions();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Kunne ikke hente genstandene. Prøv igen senere.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    this.filteredRows = this.rows.filter((row) => {
      const matchesStatus = this.statusFilter === 'alle' || row.latestStatus === this.statusFilter;
      const matchesGroup = this.groupFilter === 'alle' || row.itemGroupId === this.groupFilter;
      const matchesType = this.typeFilter === 'alle' || row.itemTypeId === this.typeFilter;
      const matchesSearch = !search ||
        row.item.serialNumber?.toLowerCase().includes(search) ||
        row.itemGroupName.toLowerCase().includes(search) ||
        row.itemTypeName.toLowerCase().includes(search);

      return matchesStatus && matchesGroup && matchesType && matchesSearch;
    });
  }

  resetFilters(): void {
    this.statusFilter = 'alle';
    this.groupFilter = 'alle';
    this.typeFilter = 'alle';
    this.searchTerm = '';
    this.applyFilters();
  }

  navigateToItem(itemId: number): void {
    this.router.navigate(['/itemDetails', itemId]);
  }

  private buildFilterOptions(): void {
    const statusSet = new Set<string>();
    const groupMap = new Map<number, GroupOption>();
    const typeMap = new Map<number, TypeOption>();

    this.rows.forEach((row) => {
      if (row.latestStatus) {
        statusSet.add(row.latestStatus);
      }

      if (row.itemGroupId && row.itemGroupName) {
        groupMap.set(row.itemGroupId, { id: row.itemGroupId, name: row.itemGroupName });
      }

      if (row.itemTypeId && row.itemTypeName) {
        typeMap.set(row.itemTypeId, { id: row.itemTypeId, name: row.itemTypeName });
      }
    });

    this.statusOptions = Array.from(statusSet).sort((a, b) => a.localeCompare(b));
    this.groupOptions = Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    this.typeOptions = Array.from(typeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapToRow(item: Item): DashboardItemRow {
    const latestStatus = this.getLatestStatusName(item);
    const groupName = item.itemGroup?.modelName ?? 'Ukendt';
    const typeName = item.itemGroup?.itemType?.typeName ?? 'Ukendt';

    return {
      item,
      latestStatus,
      itemGroupName: groupName,
      itemTypeName: typeName,
      itemGroupId: item.itemGroupId,
      itemTypeId: item.itemGroup?.itemType?.id,
    };
  }

  private getLatestStatusName(item: Item): string {
    if (!item.statusHistories || item.statusHistories.length === 0) {
      return 'Ukendt';
    }

    const sortedStatuses = [...item.statusHistories].sort((a, b) => {
      const dateA = a.statusUpdateDate ? new Date(a.statusUpdateDate).getTime() : 0;
      const dateB = b.statusUpdateDate ? new Date(b.statusUpdateDate).getTime() : 0;

      if (dateA === dateB) {
        return (b.id ?? 0) - (a.id ?? 0);
      }

      return dateB - dateA;
    });

    const latestStatus = sortedStatuses[0].status;
    return latestStatus?.typeName ?? latestStatus?.name ?? 'Ukendt';
  }
}
