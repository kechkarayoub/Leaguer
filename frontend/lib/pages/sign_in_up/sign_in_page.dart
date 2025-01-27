import 'package:flutter/material.dart';
import 'package:frontend/api/backend.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';
import 'package:frontend/utils/components.dart';
import 'package:dio/dio.dart';

class SignInPage extends StatefulWidget {
  static const routeName = '/sign-in';
  final L10n l10n;
  final StorageService storageService;

  SignInPage({required this.l10n, required this.storageService});

  @override
  SignInPageState createState() => SignInPageState();
}

class SignInPageState extends State<SignInPage> {
  bool _isSignInApiSent = false;
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailUsernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String? _errorMessage;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // App bar title with localized text
        title: Text(widget.l10n.translate("Sign In", Localizations.localeOf(context).languageCode)),
        actions: [
          // Render languages icon in the app bar
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: SizedBox(
                width: 400,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Show error message if present
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Text(
                          widget.l10n.translate(_errorMessage!, Localizations.localeOf(context).languageCode),
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                    // Email or username text field
                    TextFormField(
                      controller: _emailUsernameController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Email or Username", Localizations.localeOf(context).languageCode)),
                      validator: (value) {
                        if(value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your email or username", Localizations.localeOf(context).languageCode);
                        }
                        if(value.contains('@') && !emailRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Please enter a valid email address", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    // Password text field
                    TextFormField(
                      controller: _passwordController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Password", Localizations.localeOf(context).languageCode)),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your password", Localizations.localeOf(context).languageCode);
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 20),
                    // Sign in button
                    Container(
                      margin: EdgeInsets.only(bottom: 20),  // Add margin bottom here
                      child: ElevatedButton(
                        key: Key('signInButton'),
                        onPressed: _isSignInApiSent ? null : () {
                          if (_formKey.currentState!.validate()) {
                            // Perform the sign-in logic
                            signInUser(widget.storageService, Localizations.localeOf(context).languageCode);
                          }
                        },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (_isSignInApiSent)
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
                            Text(widget.l10n.translate("Sign In", Localizations.localeOf(context).languageCode)),
                          ]
                        )
                      )
                    ),
                    // Sign up button
                    Container(
                      margin: EdgeInsets.only(bottom: 100),  // Add margin bottom here
                      child: TextButton(
                        onPressed: () {
                          Navigator.pushNamed(context, SignUpPage.routeName);
                        },
                        child: Text(widget.l10n.translate("Don't have an account? Sign up", Localizations.localeOf(context).languageCode)),
                      ),
                    )
                  ],
                ),
              )
            ),
          ),
        ),
      ),
    );
  }


  // Function to handle user sign-in
  void signInUser(StorageService storageService, String currentLanguage, {Dio? dio}) async {
  
    final emailOrUsername = _emailUsernameController.text;
    final password = _passwordController.text;

    dio ??= Dio(); // Use default client if none is provided

    setState(() {
      _isSignInApiSent = true;
    });
    final dynamic data = {
      "email_or_username": emailOrUsername,
      "selected_language": currentLanguage,
      "password": password,
    };

    try {
      final response = await ApiBackendService.signInUser(data: data, dio: dio);

      // Assuming the response contains the user session data
      if(response["success"] && response["user"] != null){
        setState(() {
          _errorMessage = null;  // Clear the error message on successful sign-in
          _isSignInApiSent = false;
        });
        widget.storageService.set(key: 'user_session', obj: response["user"], updateNotifier: true);
      }
      else if(!response["success"] && response["message"] != null){
        setState(() {
          _errorMessage = response["message"];  // Set the error message on unsuccessful sign-in
          _isSignInApiSent = false;
        });
        logInfo('Sign-in error: ${response["message"]}');
      }
      else{
        setState(() {
          _errorMessage = "An error occurred when log in!";  // Set the error message on unsuccessful sign-in
          _isSignInApiSent = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred when log in!";  // Set the error message on unsuccessful sign-in
          _isSignInApiSent = false;
      });
      // Handle any errors that occurred during the HTTP request
      logInfo('Sign-in error: $e');
    }
  }


  @override
  void dispose() {
    _emailUsernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

}
