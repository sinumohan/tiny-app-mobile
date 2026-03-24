import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../lib/colors';
import { typography, fontSizes } from '../../lib/typography';

interface SketchFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  minLength?: number;
  style?: ViewStyle;
  numberOfLines?: number;
}

export function SketchField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  required = false,
  minLength = 0,
  style,
  numberOfLines = 4,
}: SketchFieldProps) {
  const [focused, setFocused] = useState(false);
  const isTooShort = minLength > 0 && value.length > 0 && value.length < minLength;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}> *</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          isTooShort && styles.warning,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {isTooShort && (
        <Text style={styles.warningText}>
          Be specific. Vague answers produce weak analysis.
        </Text>
      )}
      {value.length > 0 && (
        <Text style={styles.charCount}>{value.length} chars</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: typography.subheading,
    fontSize: fontSizes.base,
    color: colors.electric,
  },
  required: {
    color: colors.coral,
    fontSize: fontSizes.base,
    fontFamily: typography.subheading,
  },
  input: {
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: fontSizes.base,
    color: colors.ink,
    fontFamily: typography.body,
    lineHeight: 22,
  },
  multiline: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  focused: {
    borderBottomColor: colors.electric,
    borderColor: colors.borderFocus,
  },
  warning: {
    borderBottomColor: colors.coral,
    borderColor: colors.coral,
  },
  warningText: {
    color: colors.coral,
    fontSize: fontSizes.xs,
    fontFamily: typography.body,
    marginTop: 4,
    fontStyle: 'italic',
  },
  charCount: {
    color: colors.muted,
    fontSize: fontSizes.xs,
    fontFamily: typography.body,
    textAlign: 'right',
    marginTop: 2,
  },
});
