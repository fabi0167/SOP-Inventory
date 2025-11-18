import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan } from '../models/loan';
import { AuthService } from './auth.service';
import { ActiveLoanFilters } from '../models/active-loan-filters';

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  private readonly apiUrl = environment.apiUrl + 'Loan';

  //* getting the current user from the  AuthService\\
  currentUser: any;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.currentUser = this.authService.currentUserValue;
  }

  //* Method for getting all loans. \\
  getAll(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.apiUrl);
  }

  getActiveLoans(filters: ActiveLoanFilters): Observable<Loan[]> {
    let params = new HttpParams();

    if (filters.borrowerId) {
      params = params.set('borrowerId', filters.borrowerId.toString());
    }

    if (filters.approverId) {
      params = params.set('approverId', filters.approverId.toString());
    }

    if (filters.itemId) {
      params = params.set('itemId', filters.itemId.toString());
    }

    if (filters.loanDateFrom) {
      params = params.set('loanDateFrom', filters.loanDateFrom);
    }

    if (filters.loanDateTo) {
      params = params.set('loanDateTo', filters.loanDateTo);
    }

    if (filters.search && filters.search.trim().length > 0) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<Loan[]>(`${this.apiUrl}/active`, { params });
  }

  //* Method for getting a loan by ID. \\
  findById(loanId: number): Observable<Loan> {
    return this.http.get<Loan>(this.apiUrl + '/' + loanId);
  }

  //* Method for creating a loan. \\
  create(loan: Loan): Observable<Loan> {
    return this.http.post<Loan>(this.apiUrl, loan);
  }

  //* Method for deleting a loan by ID. \\
  delete(loanId: number, note: string): Observable<Loan> {
    return this.http.delete<Loan>(this.apiUrl + '/' + loanId, {
      body: { archiveNote: note }
    });
  }

  //* Method for updating a loan. \\
  update(loan: Loan): Observable<Loan> {
    return this.http.put<Loan>(this.apiUrl + '/' + loan.id, loan);
  }
}
