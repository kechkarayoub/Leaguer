library;
/// A customizable text button widget with support for loading indicators and icons.
///
/// This widget provides a reusable text button component that can:
/// - Display text and optional icons
/// - Show a loading indicator (disables button when loading)
/// - Support custom margins
/// 
/// When [showLoader] is true, the button is automatically disabled.
///
/// Example usage:
/// ```dart
/// CustomTextButton(
///   text: 'Cancel',
///   onPressed: () => cancelOperation(),
///   showLoader: isCancelling,
///   icon: Icon(Icons.close),
/// )

import 'package:flutter/material.dart';


/// A reusable text button widget with extended functionality.
///
/// This is a text-based button (as opposed to filled button) that supports:
/// - Standard button functionality with [onPressed] callback
/// - Loading state visualization with [showLoader] (disables button when loading)
/// - Optional leading [icon]
/// - Custom [margin] around the button
/// - Custom [keyWidget] for testing and identification
class CustomTextButton extends StatelessWidget {
  /// The callback that is called when the button is pressed.
  /// 
  /// If null or if [showLoader] is true, the button will be disabled.
  final VoidCallback? onPressed;
  
  /// The text to display on the button.
  /// 
  /// This is the primary label that users will see.
  final String text;
  
  /// The margin around the button.
  /// 
  /// If not provided, defaults to `EdgeInsets.only(bottom: 10)`.
  final EdgeInsetsGeometry? margin;
  
  /// Whether to show a loading indicator and disable the button.
  /// 
  /// When true:
  /// - A circular progress indicator will be shown before the text
  /// - The button will be disabled regardless of [onPressed] value
  final bool showLoader;
  
  /// An optional icon to display before the text.
  /// 
  /// This can be any widget, but typically an [Icon] is used.
  final Widget? icon;

  /// An optional key to identify this widget.
  /// 
  /// Useful for integration tests and widget identification.
  final Key? keyWidget;

  /// Creates a [CustomTextButton].
  ///
  /// The [text] parameter is required.
  ///
  /// The [showLoader] parameter defaults to false.
  /// When true, the button will be disabled and show a loading indicator.
  const CustomTextButton({super.key, 
    required this.text,
    this.onPressed,
    this.margin,
    this.showLoader = false,
    this.icon,
    this.keyWidget,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.only(bottom: 10),
      child: TextButton(
        key: keyWidget,
        onPressed: showLoader ? null : onPressed,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (showLoader)
              Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 2.0,
                  ),
                ),
              ),
            if (icon != null) ...[
              icon!,
              const SizedBox(width: 8),
            ],
            Text(text),
          ],
        ),
      ),
    );
  }
}
