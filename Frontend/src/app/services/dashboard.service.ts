import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DashboardSummary } from '../models/dashboard-summary';
import { DashboardStatusItem } from '../models/dashboard-status-item';
import { DashboardItemOverview } from '../models/dashboard-item-overview';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = environment.apiUrl + 'dashboard';

  constructor(private http: HttpClient) { }

  getStatusSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/status-summary`);
  }

  getItemsByStatus(statusName: string, searchTerm?: string): Observable<DashboardStatusItem[]> {
    let params = new HttpParams().set('status', statusName);

    if (searchTerm && searchTerm.trim().length > 0) {
      params = params.set('search', searchTerm.trim());
    }

    return this.http.get<DashboardStatusItem[]>(`${this.baseUrl}/status-items`, { params });
  }

  getItemsOverview(options: {
    statusCategory?: 'functional' | 'nonfunctional' | 'all';
    itemGroupId?: number | null;
    itemTypeId?: number | null;
    search?: string | null;
  }): Observable<DashboardItemOverview[]> {
    let params = new HttpParams();

    if (options.statusCategory && options.statusCategory !== 'all') {
      params = params.set('statusCategory', options.statusCategory);
    }

    if (options.itemGroupId) {
      params = params.set('itemGroupId', options.itemGroupId);
    }

    if (options.itemTypeId) {
      params = params.set('itemTypeId', options.itemTypeId);
    }

    if (options.search && options.search.trim().length > 0) {
      params = params.set('search', options.search.trim());
    }

    return this.http.get<DashboardItemOverview[]>(`${this.baseUrl}/items-overview`, { params });
  }
}
