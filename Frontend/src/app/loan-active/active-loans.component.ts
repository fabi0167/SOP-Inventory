import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { LoanService } from '../services/loan.service';
import { Loan } from '../models/loan';
import { ActiveLoanFilters } from '../models/active-loan-filters';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-active-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './active-loans.component.html',
  styleUrl: './active-loans.component.css',
})
export class ActiveLoansComponent implements OnInit, OnDestroy {
  loans: Loan[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  filters: ActiveLoanFilters = {
    search: '',
    loanDateFrom: null,
    loanDateTo: null,
  };

  private readonly searchChanges$ = new Subject<string>();
  private subscriptions: Subscription = new Subscription();

  constructor(private loanService: LoanService) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.searchChanges$
        .pipe(debounceTime(300))
        .subscribe(() => this.loadLoans()),
    );

    this.loadLoans();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearchChange(value: string): void {
    this.filters.search = value;
    this.searchChanges$.next(value);
  }

  onDateFilterChange(): void {
    this.loadLoans();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      loanDateFrom: null,
      loanDateTo: null,
    };
    this.loadLoans();
  }

  loadLoans(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.loanService.getActiveLoans(this.filters).subscribe({
      next: (loans) => {
        this.loans = loans;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.isLoading = false;
      },
    });
  }

  getBorrowerName(loan: Loan): string {
    return loan.loanUser?.name ?? loan.borrower?.name ?? '—';
  }

  getApproverName(loan: Loan): string {
    return loan.loanApprover?.name ?? loan.approver?.name ?? '—';
  }

  formatDate(value: Date | string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('da-DK');
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Kan ikke forbinde til serveren. Kontroller din netværksforbindelse.';
    }

    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    return 'Der opstod en fejl under hentning af aktive udlån.';
  }
}
