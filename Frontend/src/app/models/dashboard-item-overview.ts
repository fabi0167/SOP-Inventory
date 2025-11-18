export interface DashboardItemOverview {
  itemId: number;
  serialNumber?: string | null;
  itemGroupId?: number | null;
  itemGroupName?: string | null;
  itemTypeId?: number | null;
  itemTypeName?: string | null;
  roomName?: string | null;
  statusName?: string | null;
  statusUpdatedAt?: string | null;
  statusNote?: string | null;
  isFunctional: boolean;
}
