import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { uiColors, uiRadius, uiSpacing, uiType } from '../theme';

type Props = PressableProps & { label: string; variant?: 'primary' | 'secondary' };

export function UiButton({ label, variant = 'primary', style, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={(state) => [styles.button, variant === 'secondary' && styles.secondary, props.disabled && styles.disabled, typeof style === 'function' ? style(state) : style]}
    >
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: uiSpacing.md, backgroundColor: uiColors.primary, borderRadius: uiRadius.md },
  secondary: { backgroundColor: uiColors.surfaceContainer },
  disabled: { opacity: 0.5 },
  label: { ...uiType.labelLarge, color: uiColors.onPrimary },
  secondaryLabel: { color: uiColors.primary },
});
