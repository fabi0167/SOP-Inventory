import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DashboardSummary } from '../models/dashboard-summary';
import { DashboardStatusItem } from '../models/dashboard-status-item';

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
}
