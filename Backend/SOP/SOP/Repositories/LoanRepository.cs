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
            _context.Loan.Add(newLoan);
            await _context.SaveChangesAsync();
            return newLoan;
        }

        public async Task<Loan?> FindByIdAsync(int loanId)
        {
            return await _context.Loan
                .Include(x => x.Borrower)
                .Include(x => x.Approver)
                .Include(x => x.Item)
                .FirstOrDefaultAsync(x => x.Id == loanId);
        }

        public async Task<Loan> UpdateByIdAsync(int id, Loan newLoan)
        {
            var loan = await FindByIdAsync(id);

            if (loan != null)
            {
                loan.ReturnDate = newLoan.ReturnDate;
                loan.LoanDate = newLoan.LoanDate;
                loan.BorrowerId = newLoan.BorrowerId;
                loan.ApproverId = newLoan.ApproverId;
                loan.ItemId = newLoan.ItemId;

                await _context.SaveChangesAsync();

                loan = await FindByIdAsync(id);
            }
            return loan;
        }

        public async Task<Archive_Loan> ArchiveByIdAsync(int loanId, string archiveNote)
        {
            var loan = await FindByIdAsync(loanId);
            if (loan == null)
            {
                return null;
            }
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
            if (loan != null)
            {
                _context.Archive_Loan.Add(archiveLoan);
                _context.Loan.Remove(loan);
                await _context.SaveChangesAsync();
            }
            return archiveLoan;
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
