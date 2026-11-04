// Design tokens lấy theo bản thiết kế Figma (màu chủ đạo cyan + tím)
export const colors = {
  primary: '#00BCD4',
  primarySoft: '#E0F7FA',
  purple: '#7C4DDB',
  text: '#1F2024',
  textMuted: '#8A8D94',
  border: '#ECEEF1',
  surface: '#FFFFFF',
  background: '#F7F8FA',
  star: '#F5B301',
  danger: '#E05A5A',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24 };

// Giao diện tham khảo HTML. Giữ các token phía trên để những màn chưa chuyển đổi
// tiếp tục hiển thị như cũ trong quá trình cập nhật từng màn.
export const uiColors = {
  primary: '#3525CD',
  primaryContainer: '#4F46E5',
  primarySoft: '#E2DFFF',
  onPrimary: '#FFFFFF',
  text: '#131B2E',
  textMuted: '#464555',
  outline: '#777587',
  border: '#C7C4D8',
  background: '#FAF8FF',
  surface: '#FFFFFF',
  surfaceLow: '#F2F3FF',
  surfaceContainer: '#EAEDFF',
  surfaceHigh: '#E2E7FF',
  secondary: '#FEA619',
  onSecondary: '#131B2E',
  success: '#006E4B',
  successSoft: '#6FFBBE',
  danger: '#BA1A1A',
  dangerSoft: '#FFDAD6',
  onDanger: '#FFFFFF',
} as const;

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
  small: { shadowColor: '#131B2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  medium: { shadowColor: '#131B2E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  large: { shadowColor: '#3525CD', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
} as const;
