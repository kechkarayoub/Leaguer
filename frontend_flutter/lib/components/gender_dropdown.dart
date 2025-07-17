import 'package:flutter/material.dart';
import 'package:frontend_flutter/l10n/l10n.dart';

/// A reusable dropdown widget for selecting gender.
/// Supports localization for labels and error messages.

class GenderDropdown extends StatelessWidget {
  /// A stateless widget that renders a dropdown for selecting gender.
  ///
  /// Parameters:
  /// - `l10n`: Localization object to translate text.
  /// - `onChanged`: Callback invoked when the dropdown value changes.
  /// - `initialGender`: Pre-selected gender value, if any.
  final ValueChanged<String?> onChanged;
  final String? initialGender;
  final L10n l10n;
  final String? fieldKey;

  const GenderDropdown({super.key, required this.l10n, required this.onChanged, this.initialGender, this.fieldKey,});

  @override
  Widget build(BuildContext context) {
    /// Builds the gender dropdown widget with localization support.
    ///
    /// Returns:
    /// - A `DropdownButtonFormField` for selecting gender with localized labels and validation.
    String languageCode = Localizations.localeOf(context).languageCode;
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: l10n.translate("Gender", languageCode),
      ),
      key: Key(fieldKey??""),
      value: initialGender,
      onChanged: onChanged,
      items: <String>['', 'male', 'female']
          .map<DropdownMenuItem<String>>((String value) {
        return DropdownMenuItem<String>(
          value: value,
          child: Text(l10n.translate("${value}_gender", languageCode)),
        );
      }).toList(),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return l10n.translate("Please select your gender", languageCode);
        }
        return null;
      },
    );
  }
}
