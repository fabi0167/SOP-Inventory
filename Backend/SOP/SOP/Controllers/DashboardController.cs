using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOP.DTOs;
using SOP.Entities;
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

        [Authorize("Admin", "Instruktør", "Drift")]
        [HttpGet("status-items")]
        public async Task<IActionResult> GetItemsByStatusAsync([FromQuery] string status, [FromQuery] string? search = null)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest("Status er påkrævet.");
            }

            try
            {
                string normalizedStatus = NormalizeStatusName(status);
                var items = await _itemRepository.GetAllAsync();

                List<DashboardStatusItemResponse> responses = items
                    .Select(item => new
                    {
                        Item = item,
                        LatestStatus = item.StatusHistories?
                            .OrderByDescending(history => history.StatusUpdateDate)
                            .ThenByDescending(history => history.Id)
                            .FirstOrDefault()
                    })
                    .Where(result => result.LatestStatus != null)
                    .Where(result => NormalizeStatusName(result.LatestStatus!.Status?.Name ?? string.Empty) == normalizedStatus)
                    .Select(result => new DashboardStatusItemResponse
                    {
                        ItemId = result.Item.Id,
                        SerialNumber = result.Item.SerialNumber,
                        ItemGroupName = result.Item.ItemGroup?.ModelName,
                        RoomName = BuildRoomName(result.Item),
                        StatusUpdatedAt = result.LatestStatus!.StatusUpdateDate,
                        StatusNote = result.LatestStatus!.Note
                    })
                    .ToList();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    string trimmedSearch = search.Trim();
                    responses = responses
                        .Where(item =>
                            (!string.IsNullOrWhiteSpace(item.SerialNumber) && item.SerialNumber!.Contains(trimmedSearch, StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(item.ItemGroupName) && item.ItemGroupName!.Contains(trimmedSearch, StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(item.RoomName) && item.RoomName!.Contains(trimmedSearch, StringComparison.OrdinalIgnoreCase)))
                        .ToList();
                }

                responses = responses
                    .OrderByDescending(item => item.StatusUpdatedAt)
                    .ThenBy(item => item.SerialNumber)
                    .ToList();

                return Ok(responses);
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        private static string NormalizeStatusName(string? statusName)
        {
            return string.IsNullOrWhiteSpace(statusName)
                ? string.Empty
                : new string(statusName.Where(c => !char.IsWhiteSpace(c)).ToArray()).ToLowerInvariant();
        }

        private static string? BuildRoomName(Item item)
        {
            if (item.Room == null)
            {
                return null;
            }

            string buildingName = item.Room.Building?.BuildingName ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(buildingName))
            {
                return $"{buildingName} {item.Room.RoomNumber}";
            }

            return item.Room.RoomNumber.ToString();
        }
    }
}
