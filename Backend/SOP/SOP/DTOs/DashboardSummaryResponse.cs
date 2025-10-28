using System.Collections.Generic;

namespace SOP.DTOs
{
    public class DashboardSummaryResponse
    {
        public int TotalItemCount { get; set; }
        public List<DashboardStatusCountResponse> StatusCounts { get; set; } = new();
    }
}
