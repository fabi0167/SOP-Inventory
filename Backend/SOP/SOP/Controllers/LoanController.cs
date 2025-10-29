using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOP.Archive.DTOs;
using SOP.DTOs;
using SOP.Encryption;
using SOP.Entities;
using SOP.Repositories;

namespace SOP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoanController : ControllerBase
    {
        private readonly ILoanRepository _loanRepository;

        public LoanController(ILoanRepository loanRepository)
        {
            _loanRepository = loanRepository;
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpGet]
        public async Task<IActionResult> GetAllAsync()
        {
            try
            {
                List<Loan> loan = await _loanRepository.GetAllAsync();

                List<LoanResponse> roleResponses = loan.Select(
                    loan => MapLoanToLoanResponse(loan)).ToList();
                return Ok(roleResponses);
            }
            catch (Exception ex)
            {

                return Problem(ex.Message);
            }
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveAsync([FromQuery] ActiveLoanQuery query)
        {
            try
            {
                List<Loan> loans = await _loanRepository.GetActiveLoansAsync(
                    query.BorrowerId,
                    query.ApproverId,
                    query.ItemId,
                    query.LoanDateFrom,
                    query.LoanDateTo,
                    query.Search);

                List<LoanResponse> responses = loans
                    .Select(loan => MapLoanToLoanResponse(loan))
                    .ToList();

                return Ok(responses);
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] LoanRequest loanRequest)
        {
            try
            {
                Loan newRole = MapLoanRequestToLoan(loanRequest);

                var loan = await _loanRepository.CreateAsync(newRole);

                LoanResponse loanResponse = MapLoanToLoanResponse(loan);

                return Ok(loanResponse);
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpGet]
        [Route("{Id}")]
        public async Task<IActionResult> FindByIdAsync([FromRoute] int Id)
        {
            try
            {
                var loan = await _loanRepository.FindByIdAsync(Id);
                if (loan == null)
                {
                    return NotFound();
                }

                return Ok(MapLoanToLoanResponse(loan));
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpPut]
        [Route("{Id}")]
        public async Task<IActionResult> UpdateByIdAsync([FromRoute] int Id, [FromBody] LoanRequest loanRequest)
        {
            try
            {
                var updateLoan = MapLoanRequestToLoan(loanRequest);

                var loan = await _loanRepository.UpdateByIdAsync(Id, updateLoan);

                if (loan == null)
                {
                    return NotFound();
                }

                return Ok(MapLoanToLoanResponse(loan));
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpDelete]
        [Route("{Id}")]
        public async Task<IActionResult> ArchiveByIdAsync([FromRoute] int Id, [FromBody] ArchiveNoteRequest archiveNoteRequest)
        {
            try
            {
                string archiveNote = archiveNoteRequest.ArchiveNote;
                var loan = await _loanRepository.ArchiveByIdAsync(Id, archiveNote);
                if (loan == null)
                {
                    return NotFound();
                }

                Archive_LoanResponse loanResponse = new Archive_LoanResponse
                {
                    Id = loan.Id,
                    DeleteTime = loan.DeleteTime,
                    LoanDate = loan.LoanDate,
                    ReturnDate = loan.ReturnDate,
                    ItemId = loan.ItemId,
                    BorrowerId = loan.BorrowerId,
                    ApproverId = loan.ApproverId,
                    ArchiveNote = loan.ArchiveNote,
                };

                return Ok(loanResponse);
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        private static LoanResponse MapLoanToLoanResponse(Loan loan)
        {
            LoanResponse response = new LoanResponse
            {
                Id = loan.Id,
                LoanDate = loan.LoanDate,
                ReturnDate = loan.ReturnDate,
                ItemId = loan.ItemId,
                BorrowerId = loan.BorrowerId,
                ApproverId = loan.ApproverId,
            };

            if (loan.Borrower != null)
            {
                response.LoanUser = new LoanUserResponse
                {
                    Id = loan.Borrower.Id,
                    Email = EncryptionHelper.Decrypt(loan.Borrower.Email),
                    Name = loan.Borrower.Name,
                    TwoFactorAuthentication = loan.Borrower.TwoFactorAuthentication,
                    RoleId = loan.Borrower.RoleId,
                };
            }

            if (loan.Approver != null)
            {
                response.LoanApprover = new LoanUserResponse
                {
                    Id = loan.Approver.Id,
                    Email = EncryptionHelper.Decrypt(loan.Approver.Email),
                    Name = loan.Approver.Name,
                    TwoFactorAuthentication = loan.Approver.TwoFactorAuthentication,
                    RoleId = loan.Approver.RoleId,
                };
            }

            if (loan.Item != null)
            {
                response.LoanItem = new LoanItemResponse
                {
                    Id = loan.Item.Id,
                    ItemGroupId = loan.Item.ItemGroupId,
                    RoomId = loan.Item.RoomId,
                    SerialNumber = loan.Item.SerialNumber,
                };
            }

            return response;
        }

        private static Loan MapLoanRequestToLoan(LoanRequest loanRequest)
        {
            return new Loan
            {
                LoanDate = loanRequest.LoanDate,
                ReturnDate = loanRequest.ReturnDate,
                ItemId = loanRequest.ItemId,
                BorrowerId = loanRequest.BorrowerId,
                ApproverId = loanRequest.ApproverId != 0
                    ? loanRequest.ApproverId
                    : loanRequest.BorrowerId,
            };
        }
    }
}
