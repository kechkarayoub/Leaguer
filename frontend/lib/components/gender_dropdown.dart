import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';

class GenderDropdown extends StatelessWidget {
  final ValueChanged<String?> onChanged;
  final String? initialGender;
  final L10n l10n;

  GenderDropdown({required this.l10n, required this.onChanged, this.initialGender});

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: l10n.translate("Gender", Localizations.localeOf(context).languageCode),
      ),
      value: initialGender,
      onChanged: onChanged,
      items: <String>['m', 'f']
          .map<DropdownMenuItem<String>>((String value) {
        return DropdownMenuItem<String>(
          value: value,
          child: Text(l10n.translate("${value}_gender", Localizations.localeOf(context).languageCode)),
        );
      }).toList(),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return l10n.translate("Please select your gender", Localizations.localeOf(context).languageCode);
        }
        return null;
      },
    );
  }
}
