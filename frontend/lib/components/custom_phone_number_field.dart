import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/utils/utils.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import 'package:phone_numbers_parser/phone_numbers_parser.dart'  as phone_number_parser;


/// A customizable international phone number input field with validation and formatting.
///
/// Features:
/// - Automatic country code detection
/// - International formatting
/// - Custom validation
/// - Right-to-left (RTL) language support
/// - Searchable country selector
class CustomPhoneNumberField extends StatefulWidget {
  /// Controller for the phone number text input
  final TextEditingController controller;
  
  /// Localization instance for translations
  final L10n l10n;
  
  /// Translation key for the field label
  final String labelKey;
  
  /// Optional hint text translation key
  final String? hintText;
  
  /// Optional error text to display
  final String? errorText;
  
  /// Custom validation function
  final String? Function(String?)? validator;
  
  /// Whether the field is enabled
  final bool enabled;
  
  /// Callback when the phone number changes
  final void Function(String, PhoneNumber)? onChanged;
  
  /// Optional key for the field
  final String? fieldKey;

  /// Initial phone number value
  final PhoneNumber initialValue;
  
  /// List of allowed country ISO codes (e.g., ['MA', 'US', 'FR'])
  final List<String>? countries;

  const CustomPhoneNumberField({
    super.key,
    required this.controller,
    required this.labelKey,
    required this.l10n,
    required this.initialValue,
    this.hintText,
    this.errorText,
    this.validator,
    this.enabled = true,
    this.onChanged,
    this.fieldKey,
    this.countries,
  });

  @override
  State<CustomPhoneNumberField> createState() => _CustomPhoneNumberFieldState();
}

class _CustomPhoneNumberFieldState extends State<CustomPhoneNumberField> {
  late PhoneNumber _initialValue;
  bool isInitialized = false;  

  @override
  void initState() {
    super.initState();
    _initialValue = widget.initialValue;
    _initializePhoneNumber();
  }
  
  @override
  void didUpdateWidget(CustomPhoneNumberField oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Only update if the initialValue has changed
    if (widget.initialValue.isoCode != oldWidget.initialValue.isoCode) {
      _updateInitialValue(widget.initialValue);
    }
    
    if (widget.controller.text != oldWidget.controller.text && isInitialized) {
      _parseControllerText();
    }
  }

  /// Parses the controller text to update the initial phone number
  Future<void> _parseControllerText() async {
    try {
      final parsedNumber = phone_number_parser.PhoneNumber.parse(widget.controller.text);
      final number = PhoneNumber(
        isoCode: parsedNumber.isoCode.name,
        phoneNumber: parsedNumber.international,
      );
      _updateInitialValue(number);
    } catch (e) {
      // If parsing fails, keep the current value
      logMessage(e, 'Failed to parse phone number');
    }
  }

  /// Initializes the phone number from controller text if needed
  Future<void> _initializePhoneNumber() async {
    
    if (widget.initialValue.phoneNumber == null && widget.controller.text.isNotEmpty) {
      await _parseControllerText();
    }
    else if (widget.initialValue.phoneNumber != null && widget.controller.text.isEmpty) {
      widget.controller.text = widget.initialValue.phoneNumber ?? "";
    }
    isInitialized = true;
  }


  /// Updates the initial value and triggers a rebuild
  void _updateInitialValue(PhoneNumber newValue) {
    if (mounted) {
      setState(() {
        _initialValue = newValue;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentLanguage = Localizations.localeOf(context).languageCode;
    final theme = Theme.of(context);

    return Directionality(
      textDirection: currentLanguage == 'ar' ? TextDirection.ltr : TextDirection.ltr,
      child: InternationalPhoneNumberInput(
        key: widget.fieldKey != null ? Key(widget.fieldKey!) : null,
        onInputChanged: (PhoneNumber number) {
          //widget.controller.text = number.phoneNumber ?? '';
          widget.controller.text = number.phoneNumber ?? "";
          if (widget.onChanged != null) {
            widget.onChanged!(widget.controller.text, number);
          }
        },
        onInputValidated: (bool isValid) {
          // Additional validation handling if needed
        },
        validator: widget.validator,
        selectorConfig: const SelectorConfig(
          selectorType: PhoneInputSelectorType.DIALOG,
          useEmoji: true,
          leadingPadding: 16,
          showFlags: true,
        ),
        locale: currentLanguage,
        ignoreBlank: false,
        autoValidateMode: AutovalidateMode.onUserInteraction,
        initialValue: _initialValue,
        textFieldController: widget.controller,
        inputDecoration: InputDecoration(
          labelText: widget.l10n.translate(widget.labelKey, currentLanguage),
          hintText: widget.hintText != null 
              ? widget.l10n.translate(widget.hintText!, currentLanguage) 
              : null,
          errorText: widget.errorText,
          // errorBorder: const OutlineInputBorder(
          //   borderSide: BorderSide(color: Colors.red),
          // ),
        ),
        countries: widget.countries ?? getAllowedCuntries(),
        selectorTextStyle: theme.textTheme.bodyMedium?.copyWith(
          color: theme.textTheme.bodyMedium?.color,
        ),
        spaceBetweenSelectorAndTextField: 8,
        formatInput: true,
        keyboardType: const TextInputType.numberWithOptions(
          signed: false,
          decimal: false,
        ),
        cursorColor: theme.primaryColor,
        textStyle: theme.textTheme.bodyMedium,
        searchBoxDecoration: InputDecoration(
          hintText: widget.l10n.translate('Search country', currentLanguage),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        isEnabled: widget.enabled,
      ),
    );
  }
}