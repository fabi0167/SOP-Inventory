﻿using SOP.Archive.DTOs;

namespace SOP.Repositories
{
    public interface IItemRepository
    {
        Task<Item> CreateAsync(Item newItem);
        Task<Item?> FindByIdAsync(int itemId);
        Task<Item?> UpdateByIdAsync(int itemId, Item updateItem);
        Task<Archive_Item?> ArchiveByIdAsync(int itemId, string archiveNote);
        Task<List<Item>> GetAllAsync();
        Task<int> GetTotalCountAsync();
    }
    public class ItemRepository : IItemRepository
    {
        private readonly DatabaseContext _context;

        public ItemRepository(DatabaseContext context)
        {
            _context = context;
        }

        public async Task<Item> CreateAsync(Item newItem)
        {

            _context.Item.Add(newItem);

            await _context.SaveChangesAsync();

            newItem = await FindByIdAsync(newItem.Id);

            return newItem;
        }

        public async Task<Item?> FindByIdAsync(int itemId)
        {
            return await _context.Item
                .Include(i => i.ItemGroup)
                .ThenInclude(ig => ig.ItemType)
                .Include(i => i.StatusHistories)
                .ThenInclude(sh => sh.Status)
                .Include(i => i.Room)
                .ThenInclude(r => r.Building)
                .ThenInclude(b => b.Address)
                .Include(i => i.Loan)
                .FirstOrDefaultAsync(i => i.Id == itemId);
        }

        public async Task<List<Item>> GetAllAsync()
        {
            return await _context.Item
                .Include(i => i.ItemGroup)
                .ThenInclude(ig => ig.ItemType)
                .Include(i => i.StatusHistories)
                .ThenInclude(sh => sh.Status)
                .Include(i => i.Room)
                .ThenInclude(r => r.Building)
                .ThenInclude(b => b.Address)
                .Include(i => i.Loan)
                .ToListAsync();
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Item.CountAsync();
        }
 
        public async Task<Item?> UpdateByIdAsync(int itemId, Item updateItem)
        {
            var item = await FindByIdAsync(itemId);
            if (item != null)
            {
                item.ItemGroupId = updateItem.ItemGroupId;
                item.RoomId = updateItem.RoomId;
                item.SerialNumber = updateItem.SerialNumber;

                await _context.SaveChangesAsync();

                item = await FindByIdAsync(itemId);
            }
            return item;
        }

        // Arhchive an Item by ID, including all associated StatusHistories

        public async Task<Archive_Item> ArchiveByIdAsync(int itemId, string archiveNote)

        {
            Item item = await FindByIdAsync(itemId);
            if (item == null)
            {
                return null;
            }

            Archive_Item archiveItem = new Archive_Item
            {
                Id = item.Id,
                DeleteTime = DateTime.Now,
                ItemGroupId = item.ItemGroupId,
                RoomId = item.RoomId,
                SerialNumber = item.SerialNumber,
                ArchiveNote = archiveNote,
                StatusHistories = item.StatusHistories?
                    .Select(statusHistory => new Archive_StatusHistory
                    {
                        Id = statusHistory.Id,
                        ItemId = item.Id, 
                        StatusId = statusHistory.StatusId,
                        StatusUpdateDate = statusHistory.StatusUpdateDate,
                        Note = statusHistory.Note,
                        ArchiveNote = archiveNote,
                        DeleteTime = DateTime.Now,
                    })
                    .ToList()
            };

            if (item != null)
            {
                _context.Archive_Item.Add(archiveItem);

                // Explicitly remove StatusHistory before deleting the Item if cascade delete is not set up
                var statusHistories = _context.StatusHistory.Where(sh => sh.ItemId == item.Id);
                _context.StatusHistory.RemoveRange(statusHistories);

                _context.Item.Remove(item);
                await _context.SaveChangesAsync();
            }

            return archiveItem;
        }

    }
}
