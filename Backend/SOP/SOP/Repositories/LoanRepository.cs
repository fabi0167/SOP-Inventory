using Microsoft.EntityFrameworkCore;
using SOP.Database;
using SOP.Entities;
using System.Linq;

namespace SOP.Repositories
{
    public interface ILoanRepository
    {
        Task<List<Loan>> GetAllAsync();
        Task<Loan> CreateAsync(Loan loan);
        Task<Loan> FindByIdAsync(int id);
        Task<Loan> UpdateByIdAsync(int id, Loan loan);
        Task<Archive_Loan> ArchiveByIdAsync(int id, string archiveNote);
        Task<int> GetActiveLoanCountAsync();
        Task<List<Loan>> GetActiveLoansAsync(
            int? borrowerId,
            int? approverId,
            int? itemId,
            DateTime? loanDateFrom,
            DateTime? loanDateTo,
            string? searchTerm);
    }
    public class LoanRepository : ILoanRepository
    {
        private readonly DatabaseContext _context;

        public LoanRepository(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<List<Loan>> GetAllAsync()
        {
            return await _context.Loan
                .Include(x => x.Borrower)
                .Include(x => x.Approver)
                .Include(x => x.Item)
                .ToListAsync();
        }

        public async Task<Loan> CreateAsync(Loan newLoan)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Loan.Add(newLoan);
                await _context.SaveChangesAsync();

                await SetItemStatusAsync(newLoan.ItemId, BorrowedStatusName);

                await transaction.CommitAsync();

                return await FindByIdAsync(newLoan.Id);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Loan?> FindByIdAsync(int loanId)
        {
            return await _context.Loan
                .Include(x => x.Borrower)
                .Include(x => x.Approver)
                .Include(x => x.Item)
                .FirstOrDefaultAsync(x => x.Id == loanId);
        }

        public async Task<Loan?> UpdateByIdAsync(int id, Loan newLoan)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var loan = await FindByIdAsync(id);

                if (loan == null)
                {
                    return null;
                }

                int previousItemId = loan.ItemId;

                loan.ReturnDate = newLoan.ReturnDate;
                loan.LoanDate = newLoan.LoanDate;
                loan.BorrowerId = newLoan.BorrowerId;
                loan.ApproverId = newLoan.ApproverId;
                loan.ItemId = newLoan.ItemId;

                await _context.SaveChangesAsync();

                await SetItemStatusAsync(loan.ItemId, BorrowedStatusName);

                if (previousItemId != loan.ItemId)
                {
                    await SetItemStatusAsync(previousItemId, AvailableStatusName);
                }

                await transaction.CommitAsync();

                return await FindByIdAsync(id);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Archive_Loan?> ArchiveByIdAsync(int loanId, string archiveNote)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var loan = await FindByIdAsync(loanId);
                if (loan == null)
                {
                    return null;
                }

                int itemId = loan.ItemId;

                Archive_Loan archiveLoan = new Archive_Loan
                {
                    Id = loan.Id,
                    DeleteTime = DateTime.Now,
                    BorrowerId = loan.BorrowerId,
                    ApproverId = loan.ApproverId != 0 ? loan.ApproverId : loan.BorrowerId,
                    ItemId = loan.ItemId,
                    LoanDate = loan.LoanDate,
                    ReturnDate = loan.ReturnDate,
                    ArchiveNote = archiveNote,
                };

                _context.Archive_Loan.Add(archiveLoan);
                _context.Loan.Remove(loan);
                await _context.SaveChangesAsync();

                await SetItemStatusAsync(itemId, AvailableStatusName);

                await transaction.CommitAsync();

                return archiveLoan;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<int> GetActiveLoanCountAsync()
        {
            return await _context.Loan.CountAsync();
        }

        public async Task<List<Loan>> GetActiveLoansAsync(
            int? borrowerId,
            int? approverId,
            int? itemId,
            DateTime? loanDateFrom,
            DateTime? loanDateTo,
            string? searchTerm)
        {
            IQueryable<Loan> query = _context.Loan
                .Include(x => x.Borrower)
                .Include(x => x.Approver)
                .Include(x => x.Item);

            if (borrowerId.HasValue)
            {
                query = query.Where(loan => loan.BorrowerId == borrowerId.Value);
            }

            if (approverId.HasValue)
            {
                query = query.Where(loan => loan.ApproverId == approverId.Value);
            }

            if (itemId.HasValue)
            {
                query = query.Where(loan => loan.ItemId == itemId.Value);
            }

            if (loanDateFrom.HasValue)
            {
                query = query.Where(loan => loan.LoanDate >= loanDateFrom.Value);
            }

            if (loanDateTo.HasValue)
            {
                query = query.Where(loan => loan.LoanDate <= loanDateTo.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                string trimmedSearch = searchTerm.Trim();
                string likeValue = $"%{trimmedSearch}%";

                query = query.Where(loan =>
                    (loan.Item != null && loan.Item.SerialNumber != null && EF.Functions.Like(loan.Item.SerialNumber, likeValue)) ||
                    (loan.Borrower != null && loan.Borrower.Name != null && EF.Functions.Like(loan.Borrower.Name, likeValue)) ||
                    (loan.Approver != null && loan.Approver.Name != null && EF.Functions.Like(loan.Approver.Name, likeValue)));
            }

            return await query
                .OrderByDescending(loan => loan.LoanDate)
                .ThenByDescending(loan => loan.Id)
                .ToListAsync();
        }

        private const string BorrowedStatusName = "Udlånt";
        private const string AvailableStatusName = "Virker";

        private async Task SetItemStatusAsync(int itemId, string statusName)
        {
            var status = await GetOrCreateStatusAsync(statusName);

            int? latestStatusId = await _context.StatusHistory
                .Where(history => history.ItemId == itemId)
                .OrderByDescending(history => history.StatusUpdateDate)
                .ThenByDescending(history => history.Id)
                .Select(history => (int?)history.StatusId)
                .FirstOrDefaultAsync();

            if (latestStatusId == status.Id)
            {
                return;
            }

            StatusHistory newHistory = new StatusHistory
            {
                ItemId = itemId,
                StatusId = status.Id,
                StatusUpdateDate = DateTime.UtcNow,
                Note = null,
            };

            _context.StatusHistory.Add(newHistory);
            await _context.SaveChangesAsync();
        }

        private async Task<Status> GetOrCreateStatusAsync(string statusName)
        {
            string normalized = NormalizeStatusName(statusName);

            Status? status = await _context.Status
                .FirstOrDefaultAsync(s => NormalizeStatusName(s.Name) == normalized);

            if (status != null)
            {
                return status;
            }

            status = new Status
            {
                Name = statusName.Trim()
            };

            _context.Status.Add(status);
            await _context.SaveChangesAsync();

            return status;
        }

        private static string NormalizeStatusName(string statusName)
        {
            return new string(statusName
                .Where(c => !char.IsWhiteSpace(c))
                .Select(char.ToLowerInvariant)
                .ToArray());
        }

        public async Task<int> GetActiveLoanCountAsync()
        {
            return await _context.Loan.CountAsync();
        }

        public async Task<List<Loan>> GetActiveLoansAsync(
            int? borrowerId,
            int? approverId,
            int? itemId,
            DateTime? loanDateFrom,
            DateTime? loanDateTo,
            string? searchTerm)
        {
            IQueryable<Loan> query = _context.Loan
                .Include(x => x.Borrower)
                .Include(x => x.Approver)
                .Include(x => x.Item);

            if (borrowerId.HasValue)
            {
                query = query.Where(loan => loan.BorrowerId == borrowerId.Value);
            }

            if (approverId.HasValue)
            {
                query = query.Where(loan => loan.ApproverId == approverId.Value);
            }

            if (itemId.HasValue)
            {
                query = query.Where(loan => loan.ItemId == itemId.Value);
            }

            if (loanDateFrom.HasValue)
            {
                query = query.Where(loan => loan.LoanDate >= loanDateFrom.Value);
            }

            if (loanDateTo.HasValue)
            {
                query = query.Where(loan => loan.LoanDate <= loanDateTo.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                string trimmedSearch = searchTerm.Trim();
                string likeValue = $"%{trimmedSearch}%";

                query = query.Where(loan =>
                    (loan.Item != null && loan.Item.SerialNumber != null && EF.Functions.Like(loan.Item.SerialNumber, likeValue)) ||
                    (loan.Borrower != null && loan.Borrower.Name != null && EF.Functions.Like(loan.Borrower.Name, likeValue)) ||
                    (loan.Approver != null && loan.Approver.Name != null && EF.Functions.Like(loan.Approver.Name, likeValue)));
            }

            return await query
                .OrderByDescending(loan => loan.LoanDate)
                .ThenByDescending(loan => loan.Id)
                .ToListAsync();
        }
    }
}
