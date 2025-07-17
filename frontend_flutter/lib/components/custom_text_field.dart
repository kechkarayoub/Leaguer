
import 'package:flutter/material.dart';
import 'package:frontend_flutter/l10n/l10n.dart';



/// A customizable and reusable text form field widget.
///
/// This widget wraps [TextFormField] and allows extensive customization
/// for form inputs in a Flutter app, supporting:
/// - Dynamic localization for labels and hints using a [L10n] service.
/// - Validation, read-only states, suffix icons, and more.
///
/// Example usage:
/// ```dart
/// CustomTextFormField(
///   controller: myController,
///   labelKey: 'email',
///   l10n: AppLocalizations.of(context),
///   validator: (value) => value!.isEmpty ? 'Required' : null,
/// )
/// ```
class CustomTextFormField extends StatelessWidget {
  /// Controller to manage the input text.
  final TextEditingController controller;
  /// Localization helper to translate label and hint texts.
  final L10n l10n;
  /// Optional error message to display.
  final String? errorText;
  /// Key used for translating the label text.
  final String labelKey;
  /// Optional validator function for form validation.
  final String? Function(String?)? validator;
  /// Whether to obscure the input (e.g., for passwords).
  final bool obscureText;
  /// Whether the field is enabled for user input.
  final bool enabled;
  /// Callback when the input text changes.
  final void Function(String)? onChanged;
  /// Optional widget to display at the end of the input field.
  final Widget? suffixIcon;
  /// Whether the field is read-only.
  final bool readOnly;
  /// Optional callback when the field is tapped (useful for showing date pickers, etc.).
  final VoidCallback? onTap;
  /// Optional key used for translating hint text.
  final String? hintText;
  /// Optional key for the field (useful for tests or UI automation).
  final String? fieldKey;

  const CustomTextFormField({
    super.key,
    required this.controller,
    required this.labelKey,
    required this.l10n,
    this.errorText,
    this.validator,
    this.obscureText = false,
    this.enabled = true,
    this.onChanged,
    this.suffixIcon,
    this.readOnly = false,
    this.onTap,
    this.hintText,
    this.fieldKey,
  });

  @override
  Widget build(BuildContext context) {
    final currentLanguage = Localizations.localeOf(context).languageCode;
    
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        errorText: errorText,
        labelText: l10n.translate(labelKey, currentLanguage),
        hintText: hintText != null ? l10n.translate(hintText!, currentLanguage) : null,
        suffixIcon: suffixIcon,
      ),
      key: Key(fieldKey??""),
      obscureText: obscureText,
      enabled: enabled,
      onChanged: onChanged,
      validator: validator,
      readOnly: readOnly,
      onTap: onTap,
    );
  }
}

