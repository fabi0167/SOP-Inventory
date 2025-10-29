using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOP.DTOs;
using SOP.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SOP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private static readonly HashSet<string> BorrowedStatusNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "Udlånt",
            "Udlejet",
            "Loaned"
        };

        private static readonly HashSet<string> NonFunctionalStatusNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "Gik stykker",
            "Skadet",
            "Defekt",
            "Virker ikke",
            "Under service",
            "Til reparation",
            "I reparation"
        };

        private readonly IStatusHistoryRepository _statusHistoryRepository;
        private readonly IItemRepository _itemRepository;
        private readonly ILoanRepository _loanRepository;

        public DashboardController(
            IStatusHistoryRepository statusHistoryRepository,
            IItemRepository itemRepository,
            ILoanRepository loanRepository)
        {
            _statusHistoryRepository = statusHistoryRepository;
            _itemRepository = itemRepository;
            _loanRepository = loanRepository;
        }

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpGet("status-summary")]
        public async Task<IActionResult> GetStatusSummaryAsync()
        {
            try
            {
                var statusHistories = await _statusHistoryRepository.GetAllAsync();

                var latestStatuses = statusHistories
                    .GroupBy(history => history.ItemId)
                    .Select(group => group
                        .OrderByDescending(history => history.StatusUpdateDate)
                        .ThenByDescending(history => history.Id)
                        .First());

                var statusCounts = latestStatuses
                    .GroupBy(history => history.Status?.Name ?? "Ukendt")
                    .Select(group => new DashboardStatusCountResponse
                    {
                        Status = group.Key,
                        Count = group.Count()
                    })
                    .OrderBy(result => result.Status)
                    .ToList();

                var totalCount = await _itemRepository.GetTotalCountAsync();
                var activeLoanCount = await _loanRepository.GetActiveLoanCountAsync();

                int borrowedCount = statusCounts
                    .Where(status => BorrowedStatusNames.Contains(status.Status))
                    .Sum(status => status.Count);

                int nonFunctionalCount = statusCounts
                    .Where(status =>
                        NonFunctionalStatusNames.Contains(status.Status) ||
                        status.Status.Contains("ikke", StringComparison.OrdinalIgnoreCase) ||
                        status.Status.Contains("defekt", StringComparison.OrdinalIgnoreCase) ||
                        status.Status.Contains("skadet", StringComparison.OrdinalIgnoreCase) ||
                        status.Status.Contains("service", StringComparison.OrdinalIgnoreCase) ||
                        status.Status.Contains("reparation", StringComparison.OrdinalIgnoreCase))
                    .Sum(status => status.Count);

                DashboardSummaryResponse response = new DashboardSummaryResponse
                {
                    TotalItemCount = totalCount,
                    StatusCounts = statusCounts,
                    BorrowedItemCount = borrowedCount,
                    NonFunctionalItemCount = nonFunctionalCount,
                    ActiveLoanCount = activeLoanCount
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }
    }
}
