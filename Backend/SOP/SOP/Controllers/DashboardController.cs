using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOP.DTOs;
using SOP.Repositories;
using System.Linq;

namespace SOP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IStatusHistoryRepository _statusHistoryRepository;
        private readonly IItemRepository _itemRepository;

        public DashboardController(IStatusHistoryRepository statusHistoryRepository, IItemRepository itemRepository)
        {
            _statusHistoryRepository = statusHistoryRepository;
            _itemRepository = itemRepository;
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

                DashboardSummaryResponse response = new DashboardSummaryResponse
                {
                    TotalItemCount = totalCount,
                    StatusCounts = statusCounts
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
