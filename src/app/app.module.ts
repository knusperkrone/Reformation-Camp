import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HttpModule, Http } from '@angular/http';
import { IonicStorageModule } from "@ionic/storage/es2015";

// Native
import { File } from '@ionic-native/file';
import { SQLite } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { Vibration } from '@ionic-native/vibration';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Network } from '@ionic-native/network';
// Libarys
import { SuperTabsModule } from 'ionic2-super-tabs';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// Services
import { DatabaseService } from './../providers/database.service';
import { NotificationService } from './../providers/notification.service';
import { SettingService } from './../providers/settings.service';
// Pages
import { HomePage } from '../pages/home/home';
import { CategoryPage } from './../pages/category/category';
// AboutModal
import { SettingsModal } from './../components/settings/settings-modal.component';
import { NoteModal } from './../components/note/note-modal.component';
import { AboutModal } from './../components/about/about-modal.component';
import { UpdaterService } from "../providers/updater.service";

@NgModule({
    declarations: [
        MyApp,
        HomePage,
        NoteModal,
        CategoryPage,
        SettingsModal,
        AboutModal,
    ],
    imports: [
        BrowserModule,
        HttpModule,
        IonicModule.forRoot(MyApp),
        IonicStorageModule.forRoot(),
        SuperTabsModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [Http]
            }
        })
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        NoteModal,
        CategoryPage,
        SettingsModal,
        AboutModal,
    ],
    providers: [
        StatusBar,
        SplashScreen,
        DatabaseService,
        SettingService,
        UpdaterService,
        NotificationService,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        File,
        SQLite,
        SQLitePorter,
        LocalNotifications,
        Vibration,
        InAppBrowser,
        Network,
    ]
})
export class AppModule { }

export function createTranslateLoader(http: Http) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
