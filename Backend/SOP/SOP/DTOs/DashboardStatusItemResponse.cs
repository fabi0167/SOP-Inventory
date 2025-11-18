using System;

namespace SOP.DTOs
{
    public class DashboardStatusItemResponse
    {
        public int ItemId { get; set; }
        public string? SerialNumber { get; set; }
        public string? ItemGroupName { get; set; }
        public string? RoomName { get; set; }
        public DateTime StatusUpdatedAt { get; set; }
        public string? StatusNote { get; set; }
    }
}
