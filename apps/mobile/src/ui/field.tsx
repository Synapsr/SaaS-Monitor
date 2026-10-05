import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors, radius } from "@/ui/theme";

/** A text field of the app, dark like everything around it. */
export const Field = forwardRef<TextInput, TextInputProps & { invalid?: boolean }>(function Field(
  { invalid = false, style, ...props },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.ink3}
      keyboardAppearance="dark"
      selectionColor={colors.accent}
      maxFontSizeMultiplier={2}
      style={[
        {
          minHeight: 50,
          borderRadius: radius.medium,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          color: colors.ink,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: invalid ? colors.danger : colors.hairline,
        },
        style,
      ]}
      {...props}
    />
  );
});
