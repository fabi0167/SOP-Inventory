export interface DashboardStatusItem {
  itemId: number;
  serialNumber: string | null;
  itemGroupName: string | null;
  roomName: string | null;
  statusUpdatedAt: string;
  statusNote: string | null;
}
