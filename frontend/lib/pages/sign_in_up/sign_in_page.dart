import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';
import 'package:frontend/utils/components.dart';
import 'package:dio/dio.dart';

class SignInPage extends StatefulWidget {
  static const routeName = '/sign-in';
  final L10n l10n;
  final SecureStorageService secureStorageService;
  final StorageService storageService;

  const SignInPage({super.key, required this.l10n, required this.storageService, required this.secureStorageService});

  @override
  SignInPageState createState() => SignInPageState();
}

class SignInPageState extends State<SignInPage> {
  bool _isSignInApiSent = false;
  bool _isResendVerificationEmailApiSent = false;
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailUsernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String? _errorMessage;
  String? _successMessage;
  bool _showSendEmailVerificationLinkButton = false;
  dynamic _userId;

  @override
  Widget build(BuildContext context) {
    String currentLanguage = Localizations.localeOf(context).languageCode;
    final arguments = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
    String username = arguments?["username"] ?? ""; // Extract the email parameter if available
    if(username.isNotEmpty){
      _emailUsernameController.text = username;
    }
    bool showSignUpButton = (dotenv.env['ENABLE_USERS_REGISTRATION'] ?? 'false') == "true";
    return Scaffold(
      appBar: AppBar(
        // App bar title with localized text
        title: Text(widget.l10n.translate("Sign In", currentLanguage)),
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
                    // Email or username text field
                    TextFormField(
                      controller: _emailUsernameController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Email or Username", currentLanguage)),
                      validator: (value) {
                        if(value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your email or username", currentLanguage);
                        }
                        if(value.contains('@') && !emailRegExp.hasMatch(value)) {
                          return widget.l10n.translate("Please enter a valid email address", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    // Password text field
                    TextFormField(
                      controller: _passwordController,
                      decoration: InputDecoration(labelText: widget.l10n.translate("Password", currentLanguage)),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return widget.l10n.translate("Please enter your password", currentLanguage);
                        }
                        return null;
                      },
                    ),
                    // Show error message if present
                    if (_errorMessage != null)
                      Column(
                        children: [
                          SizedBox(height: 20),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Text(
                              widget.l10n.translate(_errorMessage!, currentLanguage),
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    // Show error message if present
                    if (_successMessage != null)
                      Column(
                        children: [
                          SizedBox(height: 20),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: Text(
                              widget.l10n.translate(_successMessage!, currentLanguage),
                              style: TextStyle(color: Colors.green),
                            ),
                          ),
                        ],
                      ),
                    SizedBox(height: 20),
                    // Sign in button
                    Container(
                      margin: EdgeInsets.only(bottom: showSignUpButton || _showSendEmailVerificationLinkButton ? 20 : 100),  // Add margin bottom here
                      child: ElevatedButton(
                        key: Key('signInButton'),
                        onPressed: _isSignInApiSent ? null : () {
                          setState(() {
                            _errorMessage = null;
                          });
                          if (_formKey.currentState!.validate()) {
                            // Perform the sign-in logic
                            signInUser(widget.storageService, currentLanguage, widget.secureStorageService);
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
                            Text(widget.l10n.translate("Sign In", currentLanguage)),
                          ]
                        )
                      )
                    ),
                    // Sign up button
                    if(showSignUpButton)
                      Container(
                        margin: EdgeInsets.only(bottom: _showSendEmailVerificationLinkButton ? 20 : 100),  // Add margin bottom here
                        child: TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, SignUpPage.routeName);
                          },
                          child: Text(widget.l10n.translate("Don't have an account? Sign up", currentLanguage)),
                        ),
                      ),
                    // send email verification link button
                    if(_showSendEmailVerificationLinkButton && _userId != null)
                      Container(
                        margin: EdgeInsets.only(bottom: 100),  // Add margin bottom here
                        child: TextButton(
                          onPressed: _isResendVerificationEmailApiSent ? null : () {
                            resendEmailVerificationLink(_userId, currentLanguage);
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (_isResendVerificationEmailApiSent)
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
                              Text(widget.l10n.translate("Resend verification email link", currentLanguage)),
                            ]
                          )
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
  void resendEmailVerificationLink(dynamic userId, String currentLanguage, {Dio? dio}) async {
  
    dio ??= Dio(); // Use default client if none is provided

    setState(() {
      _errorMessage = null;  // Clear the error message on successful sign-in
      _isResendVerificationEmailApiSent = true;
    });
    final dynamic data = {
      "selected_language": currentLanguage,
      "user_id": userId,
    };

    try {
      final response = await UnauthenticatedApiBackendService.resendVerificationEmail(data: data, dio: dio);

      // Assuming the response contains the user session data
      if(response["success"]){
        setState(() {
          _errorMessage = null;  // Clear the error message on successful resend verification email
          _successMessage = "A new verification link has been sent to your email address. Please verify your email before logging in.";
          _isResendVerificationEmailApiSent = false;
        });
      }
      else if(!response["success"]){
        setState(() {
          _errorMessage = response["message"];  // Set the error message on unsuccessful resend verification email
          _successMessage = null;
          _isResendVerificationEmailApiSent = false;
        });
      }
      else{
        setState(() {
          _errorMessage = "An error occurred while resending the verification email";  // Set the error message on unsuccessful resend verification email
          _successMessage = null;
          _isResendVerificationEmailApiSent = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred while resending the verification email";  // Set the error message on unsuccessful resend verification email
        _successMessage = null;
        _isResendVerificationEmailApiSent = false;
      });
      // Handle any errors that occurred during the HTTP request
      logMessage('Sign-in error: $e');
    }
  }



  // Function to handle user sign-in
  void signInUser(StorageService storageService, String currentLanguage, SecureStorageService secureStorageService, {Dio? dio}) async {
  
    final emailOrUsername = _emailUsernameController.text;
    final password = _passwordController.text;

    dio ??= Dio(); // Use default client if none is provided

    setState(() {
      _errorMessage = null;  // Clear the error message on successful sign-in
      _isSignInApiSent = true;
      _showSendEmailVerificationLinkButton = false;
      _userId = null;
    });
    final dynamic data = {
      "email_or_username": emailOrUsername,
      "selected_language": currentLanguage,
      "password": password,
    };

    try {
      final response = await UnauthenticatedApiBackendService.signInUser(data: data, dio: dio);

      // Assuming the response contains the user session data
      if(response["success"] && response["user"] != null){
        setState(() {
          _errorMessage = null;  // Clear the error message on successful sign-in
          _successMessage = null;
          _isSignInApiSent = false;
        });
        widget.secureStorageService.saveTokens(response["access_token"], response["refresh_token"]);
        widget.storageService.set(key: 'user', obj: response["user"], updateNotifier: true);
      }
      else if(!response["success"] && response["message"] != null){
        setState(() {
          _errorMessage = response["message"];  // Set the error message on unsuccessful sign-in
          _successMessage = null;
          _isSignInApiSent = false;
          _showSendEmailVerificationLinkButton = response["user_id"] != null;
          _userId = response["user_id"];
        });
      }
      else{
        setState(() {
          _errorMessage = "An error occurred when log in!";  // Set the error message on unsuccessful sign-in
          _successMessage = null;
          _isSignInApiSent = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred when log in!";  // Set the error message on unsuccessful sign-in
        _successMessage = null;
        _isSignInApiSent = false;
      });
      // Handle any errors that occurred during the HTTP request
      logMessage('Sign-in error: $e');
    }
  }


  @override
  void dispose() {
    _emailUsernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

}
