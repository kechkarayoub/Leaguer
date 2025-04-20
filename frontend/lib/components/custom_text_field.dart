
import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';



class CustomTextFormField extends StatelessWidget {
  final TextEditingController controller;
  final L10n l10n;
  final String? errorText;
  final String labelKey;
  final String? Function(String?)? validator;
  final bool obscureText;
  final bool enabled;
  final void Function(String)? onChanged;
  final Widget? suffixIcon;
  final bool readOnly;
  final VoidCallback? onTap;
  final String? hintText;
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

