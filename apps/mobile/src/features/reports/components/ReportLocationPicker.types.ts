import type { Coordinate } from '@trending-map/contracts';

export type SelectedReportLocation = {
  coordinate: Coordinate;
  addressLabel: string;
};

export type ReportLocationPickerProps = {
  visible: boolean;
  initialCoordinate?: Coordinate;
  onClose: () => void;
  onSelect: (location: SelectedReportLocation) => void;
};
