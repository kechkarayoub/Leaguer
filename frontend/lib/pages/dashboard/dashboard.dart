import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';
import 'package:frontend/storage/storage.dart';
import 'package:frontend/utils/components.dart';

class DashboardPage extends StatefulWidget {
  static const routeName = '/dashboard';
  final L10n l10n;
  final dynamic userSession;
  final StorageService storageService;

  DashboardPage({required this.l10n, required this.userSession, required this.storageService});

  @override
  DashboardPageState createState() => DashboardPageState();
}

class DashboardPageState extends State<DashboardPage> {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.l10n.translate("Hello", Localizations.localeOf(context).languageCode)} ${widget.userSession['last_name']}'),
        actions: [
          renderLanguagesIcon(widget.l10n, widget.storageService, context),
        ],
      ),
      drawer: renderDrawerMenu(widget.l10n, widget.storageService, context),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: null,
      ),
    );
  }

}
