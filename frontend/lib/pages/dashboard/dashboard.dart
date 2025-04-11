import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/components.dart';
import 'package:frontend/utils/utils.dart';

class DashboardPage extends StatefulWidget {
  static const routeName = routeDashboard;
  final L10n l10n;
  final dynamic userSession;
  final SecureStorageService secureStorageService;
  final StorageService storageService;

  const DashboardPage({super.key, required this.l10n, required this.userSession, required this.storageService, required this.secureStorageService});

  @override
  DashboardPageState createState() => DashboardPageState();
}

class DashboardPageState extends State<DashboardPage> {

  @override
  Widget build(BuildContext context) {
    // Handle null user session using post-frame callback
    if (widget.userSession == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && !Navigator.of(context).userGestureInProgress) {
          Navigator.pushReplacementNamed(context, routeSignIn);
        }
      });
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.l10n.translate("Hello", Localizations.localeOf(context).languageCode)} ${widget.userSession['last_name']}'),
        actions: [
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      drawer: renderDrawerMenu(widget.l10n, widget.storageService, widget.secureStorageService, context),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: null,
      ),
    );
  }

}
