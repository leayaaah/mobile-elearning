import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { uiColors, uiRadius, uiSpacing, uiType } from '../theme';

export function UiInput({ style, placeholderTextColor = uiColors.outline, ...props }: TextInputProps) {
  return <TextInput {...props} placeholderTextColor={placeholderTextColor} style={[styles.input, style]} />;
}

const styles = StyleSheet.create({
  input: { minHeight: 48, paddingHorizontal: uiSpacing.md, paddingVertical: uiSpacing.sm, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.md, backgroundColor: uiColors.surface, color: uiColors.text, ...uiType.bodyMedium },
});
