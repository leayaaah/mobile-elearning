// Bảng màu nền tảng dùng cho các màn hình chưa chuyển sang theme động.
export const colors = {
  primary: '#0B7285',
  primarySoft: '#D8F3F0',
  purple: '#0F8B8D',
  text: '#172B35',
  textMuted: '#52636B',
  border: '#DCE5E8',
  surface: '#FFFFFF',
  background: '#F5F9FA',
  star: '#F3A712',
  danger: '#B42318',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24 };

// Màu giao diện thống nhất: xanh teal tạo cảm giác tin cậy, nền trung tính thoáng,
// vàng ấm dành cho điểm nhấn và trạng thái nổi bật.
export const uiColors = {
  primary: '#0B7285',
  primaryContainer: '#0F8B8D',
  primarySoft: '#D8F3F0',
  onPrimary: '#FFFFFF',
  text: '#172B35',
  textMuted: '#52636B',
  outline: '#71818A',
  border: '#DCE5E8',
  background: '#F5F9FA',
  surface: '#FFFFFF',
  surfaceLow: '#EEF5F6',
  surfaceContainer: '#E5EFF1',
  surfaceHigh: '#DCE9EC',
  secondary: '#F3A712',
  onSecondary: '#352600',
  success: '#087443',
  successSoft: '#D7F5E5',
  danger: '#B42318',
  dangerSoft: '#FEE4E2',
  onDanger: '#FFFFFF',
} as const;

export type UiColors = { [K in keyof typeof uiColors]: string };

export const darkUiColors: UiColors = {
  primary: '#55D6C2',
  primaryContainer: '#8CE7D8',
  primarySoft: '#123B3B',
  onPrimary: '#062E2B',
  text: '#E8F1F2',
  textMuted: '#B2C3C7',
  outline: '#91A6AB',
  border: '#3B5157',
  background: '#101A1D',
  surface: '#172428',
  surfaceLow: '#1D2D31',
  surfaceContainer: '#26383D',
  surfaceHigh: '#30454A',
  secondary: '#FFC45B',
  onSecondary: '#352600',
  success: '#75D7A3',
  successSoft: '#173B2C',
  danger: '#FFB4AB',
  dangerSoft: '#4D2529',
  onDanger: '#5A1210',
};

export const uiSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  gutter: 20,
  lg: 24,
  xl: 32,
} as const;

export const uiRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const uiType = {
  labelSmall: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  headlineSmall: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  headlineMedium: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  headlineLarge: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  displayMobile: { fontSize: 28, lineHeight: 36, fontWeight: '800' },
  displayLarge: { fontSize: 36, lineHeight: 44, fontWeight: '800' },
} as const;

// Các giá trị bóng tương thích StyleSheet trên Android, iOS và web.
export const uiShadow = {
  small: { shadowColor: '#172B35', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  medium: { shadowColor: '#172B35', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  large: { shadowColor: '#0B7285', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
} as const;
