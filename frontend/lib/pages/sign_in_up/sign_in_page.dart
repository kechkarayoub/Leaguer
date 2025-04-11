
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:frontend/api/unauthenticated_api_service.dart';
import 'package:frontend/components/custom_password_field.dart';
import 'package:frontend/components/custom_text_field.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/pages/sign_in_up/sign_up_page.dart';
import 'package:frontend/pages/dashboard/dashboard.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/utils.dart';
import 'package:frontend/utils/components.dart';

class SignInPage extends StatefulWidget {
  static const routeName = routeSignIn;
  final L10n l10n;
  final SecureStorageService secureStorageService;
  final StorageService storageService;
  final ThirdPartyAuthService? thirdPartyAuthService;

  const SignInPage({super.key, required this.l10n, required this.storageService, required this.secureStorageService, this.thirdPartyAuthService,});

  @override
  SignInPageState createState() => SignInPageState();
}

class SignInPageState extends State<SignInPage> {
  bool _isSignInApiSent = false; // Flag to disable sign-in button while processing
  bool _isSignInThirdPartyApiSent = false; // Flag to disable third party sign-in button while processing
  String typeThirdPartyApiSent = "";
  bool _isResendVerificationEmailApiSent = false; // Flag to disable resend button
  final _formKey = GlobalKey<FormState>(); // Form key for validation
  final TextEditingController _emailUsernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  String? _errorMessage; // Stores error messages to display
  String? _successMessage; // Stores success messages
  bool _showSendEmailVerificationLinkButton = false;
  dynamic _userId; // Stores user ID for email verification
  late ThirdPartyAuthService _thirdPartyAuthService; 
  @override
  void initState() {
    super.initState();
    // Use the injected service or create a new one
    _thirdPartyAuthService = widget.thirdPartyAuthService ?? ThirdPartyAuthService();
  }

  Widget _buildEmailUsernameField(String currentLanguage) {
    return CustomTextFormField(
      controller: _emailUsernameController,
      l10n: widget.l10n,
      labelKey: "Email or Username",
      validator: (value) {
        if(value == null || value.isEmpty) {
          return widget.l10n.translate("Please enter your email or username", currentLanguage);
        }
        if(value.contains('@') && !emailRegExp.hasMatch(value)) {
          return widget.l10n.translate("Please enter a valid email address", currentLanguage);
        }
        return null;
      },
    );
    
  }

  Widget _buildPasswordField(String currentLanguage) {
    return CustomPasswordFormField(
      controller: _passwordController,
      l10n: widget.l10n,
      labelKey: "Current password",
      obscureText: true,
      validator: (value) {
        if (value == null || value.isEmpty) {
          return widget.l10n.translate("Please enter your password", currentLanguage);
        }
        return null;
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    // // Handle null user session using post-frame callback
    // final userSession = await widget.storageService.get('user');
    // if (userSession != null) {
    //   WidgetsBinding.instance.addPostFrameCallback((_) {
    //     if (mounted && !Navigator.of(context).userGestureInProgress) {
    //       Navigator.pushReplacementNamed(context, routeSignIn);
    //     }
    //   });
    //   return Scaffold(body: Center(child: CircularProgressIndicator()));
    // }
    String currentLanguage = Localizations.localeOf(context).languageCode;
    // Extract the email parameter if available from the previous screen
    final arguments = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
    String username = arguments?["username"] ?? ""; // Extract the email parameter if available
    if(username.isNotEmpty){
      _emailUsernameController.text = username;
    }
    bool showSignUpButton = (dotenv.env['ENABLE_USERS_REGISTRATION'] ?? 'false') == "true";
    bool showSignInWithGoogleButton = (dotenv.env['ENABLE_LOG_IN_WITH_GOOGLE'] ?? 'false') == "true";
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
                    _buildEmailUsernameField(currentLanguage),
                    // Password text field
                    _buildPasswordField(currentLanguage),
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
                      margin: EdgeInsets.only(bottom: showSignUpButton || showSignInWithGoogleButton || _showSendEmailVerificationLinkButton ? 20 : 100),  // Add margin bottom here
                      child: ElevatedButton(
                        key: Key('signInButton'),
                        onPressed: _isSignInApiSent || _isSignInThirdPartyApiSent ? null : () {
                          setState(() {
                            _errorMessage = null;
                          });
                          if (_formKey.currentState!.validate()) {
                            // Perform the sign-in logic
                            signInUser(widget.storageService, currentLanguage, widget.secureStorageService, context: context);
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
                        margin: EdgeInsets.only(bottom: showSignInWithGoogleButton || _showSendEmailVerificationLinkButton ? 20 : 100),  // Add margin bottom here
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
                        margin: EdgeInsets.only(bottom: showSignInWithGoogleButton ? 20 : 100),  // Add margin bottom here
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
                      ),
                    if(showSignInWithGoogleButton)
                      Container(
                        margin: EdgeInsets.only(bottom: 100),  // Add margin bottom here
                        child: TextButton(
                          key: Key('googleSignInButton'),
                          onPressed: _isSignInApiSent || _isSignInThirdPartyApiSent ? null : () {
                            thirdPrtySignIn("google", widget.storageService, currentLanguage, widget.secureStorageService, context: context);
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (_isSignInThirdPartyApiSent && typeThirdPartyApiSent == "google")
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
                              FaIcon(
                                FontAwesomeIcons.google,  // Icon from Font Awesome
                                size: 20.0,               // Icon size
                                color: Colors.red, 
                              ),
                              SizedBox(width: 8), // Add margin between the icon and text
                              Text(widget.l10n.translate("Sign in with Google", currentLanguage)),
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
  void signInUser(StorageService storageService, String currentLanguage, SecureStorageService secureStorageService, {Dio? dio, BuildContext? context}) async {
  
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
        if (context != null && context.mounted) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            //Navigator.pushReplacementNamed(context, routeDashboard);
            Navigator.pushNamed(context, routeDashboard);
          });
        }
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



  /// Handles third-party authentication (e.g., Google Sign-In).
  /// This method initiates the third-party sign-in flow, retrieves user credentials,
  /// and sends them to the backend for verification and token generation.
  ///
  /// Parameters:
  /// - [typeThirdPartyApiSent]: The type of third-party authentication (e.g., "google").
  /// - [storageService]: The storage service for saving user data.
  /// - [currentLanguage]: The current language for localization.
  /// - [secureStorageService]: The secure storage service for saving tokens.
  /// - [dio]: Optional Dio client for HTTP requests.
  void thirdPrtySignIn(String typeThirdPartyApiSent, StorageService storageService, String currentLanguage, SecureStorageService secureStorageService, {Dio? dio, BuildContext? context}) async {
  
    dio ??= Dio(); // Use default client if none is provided
    setState(() {
      _errorMessage = null;  // Clear the error message on successful sign-in third party
      _isSignInApiSent = false;
      _showSendEmailVerificationLinkButton = false;
      _isSignInThirdPartyApiSent = true;
      typeThirdPartyApiSent = typeThirdPartyApiSent;
      _userId = null;
    });

    try {
      if(typeThirdPartyApiSent == "google"){
        UserCredential? userCredential = await _thirdPartyAuthService.signInWithGoogle();
        final User? user = userCredential?.user;
        if (user == null) {
          // The pop up is closed or canceled by the user
          setState(() {
            _errorMessage = null;  
            _successMessage = null;
            _isSignInThirdPartyApiSent = false;
            typeThirdPartyApiSent = "";
          });
        }
        else{
          final idToken = await user.getIdToken();
          final dynamic data = {
            "email": user.email,
            "id_token": idToken,
            "selected_language": currentLanguage,
            "type_third_party": "google",
          };

          try {
            final response = await UnauthenticatedApiBackendService.signInUserWithThirdParty(data: data, dio: dio);
            // Assuming the response contains the user session data
            if(response["success"] && response["user"] != null){
              setState(() {
                _errorMessage = null;  // Clear the error message on successful sign-in with third party
                _successMessage = null;
                _isSignInThirdPartyApiSent = false;
              });
              widget.secureStorageService.saveTokens(response["access_token"], response["refresh_token"]);
              widget.storageService.set(key: 'user', obj: response["user"], updateNotifier: true);
              if (context != null && context.mounted) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  //Navigator.pushReplacementNamed(context, routeDashboard);
                  Navigator.pushNamed(context, routeDashboard);
                });
              }
            }
            else if(!response["success"] && response["message"] != null){
              await _thirdPartyAuthService.signOut();
              setState(() {
                _errorMessage = response["message"];  // Set the error message on unsuccessful sign-in with third party
                _successMessage = null;
                _isSignInThirdPartyApiSent = false;
                typeThirdPartyApiSent = "";
              });
            }
            else{
              await _thirdPartyAuthService.signOut();
              setState(() {
                _errorMessage = "An error occurred when log in with $typeThirdPartyApiSent!";  // Set the error message on unsuccessful sign-in with third party
                _successMessage = null;
                _isSignInThirdPartyApiSent = false;
                typeThirdPartyApiSent = "";
              });
            }
          } catch (e) {
            await _thirdPartyAuthService.signOut();
            setState(() {
              _errorMessage = "An error occurred when log in with $typeThirdPartyApiSent!";  // Set the error message on unsuccessful sign-in with third party
              _successMessage = null;
              _isSignInThirdPartyApiSent = false;
              typeThirdPartyApiSent = "";
            });
            // Handle any errors that occurred during the HTTP request
            logMessage(e, 'Sign-in with $typeThirdPartyApiSent error: ', "e");
          }
        }
      }

      
    }  on FirebaseAuthException catch (e) {
      setState(() {
        _errorMessage = e.code == "popup-closed-by-user" ? null : "An error occurred when log in with $typeThirdPartyApiSent!";  // Set the error message on unsuccessful sign-in with third party
        _successMessage = null;
        _isSignInThirdPartyApiSent = false;
        typeThirdPartyApiSent = "";
      });
      // Handle any errors that occurred during the HTTP request
      logMessage(e, 'Sign-in with $typeThirdPartyApiSent error:', "e");
    } catch (e) {
      setState(() {
        _errorMessage = e.toString() == "popup_closed" ? null : "An error occurred when log in with $typeThirdPartyApiSent!";  // Set the error message on unsuccessful sign-in with third party
        _successMessage = null;
        _isSignInThirdPartyApiSent = false;
        typeThirdPartyApiSent = "";
      });
      // Handle any errors that occurred during the HTTP request
      logMessage(e, 'Sign-in with $typeThirdPartyApiSent error:', "e");
    }
  }


  @override
  void dispose() {
    _emailUsernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

}
