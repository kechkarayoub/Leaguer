
import 'package:flutter/material.dart';
import 'package:frontend/components/custom_text_field.dart';
import 'package:frontend/l10n/l10n.dart';



class CustomPasswordFormField extends StatefulWidget {
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

  const CustomPasswordFormField({
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
  });


  @override
  State<CustomPasswordFormField> createState() => _CustomPasswordFormField();
  
}

class _CustomPasswordFormField extends State<CustomPasswordFormField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return CustomTextFormField(
      controller: widget.controller,
      labelKey: widget.labelKey,
      l10n: widget.l10n,
      errorText: widget.errorText,
      readOnly: widget.readOnly,
      enabled: widget.enabled,
      validator: widget.validator,
      obscureText: _obscureText,
      onChanged: widget.onChanged,
      onTap: widget.onTap,
      hintText: widget.hintText,
      suffixIcon: IconButton(
        icon: Icon(
          _obscureText ? Icons.visibility : Icons.visibility_off,
        ),
        onPressed: () {
          setState(() {
            _obscureText = !_obscureText;
          });
        },
      ),
    );
  }
}

