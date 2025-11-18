using System;

namespace SOP.DTOs
{
    public class DashboardItemOverviewResponse
    {
        public int ItemId { get; set; }
        public string? SerialNumber { get; set; }
        public int? ItemGroupId { get; set; }
        public string? ItemGroupName { get; set; }
        public int? ItemTypeId { get; set; }
        public string? ItemTypeName { get; set; }
        public string? RoomName { get; set; }
        public string? StatusName { get; set; }
        public DateTime? StatusUpdatedAt { get; set; }
        public string? StatusNote { get; set; }
        public bool IsFunctional { get; set; }
    }
}
