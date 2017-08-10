import { AboutModal } from './../components/about/about-modal.component';
import { SettingsModal } from './../components/settings/settings-modal.component';
import { HomePage } from './../pages/home/home';
import { DatabaseService } from './../providers/database.service';
import { CategoryPage } from './../pages/category/category';
import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';


@Component({
    templateUrl: './app.component.html'
})
export class MyApp {

    @ViewChild(Nav) nav: Nav;
    rootPage: any = null
    readonly pages = { HomePage };

    private categorys: string[] = [];

    constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private dbService: DatabaseService,
        private modalCtrl: ModalController, translate : TranslateService) {
        translate.setDefaultLang('en');

        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            statusBar.styleDefault();
            // Open program in the beginning
            var subscription = dbService.getDatabaseState().subscribe((rdy) => {
                if (rdy && this.rootPage == null) { // Only on init!
                    dbService.getCategoryNames().then((names) => this.categorys = names);
                    this.openProgram();
                    splashScreen.hide();
                    subscription.unsubscribe()
                }
            });
        });
    }

    private openCategorie(categoryName: string) {
        this.dbService.getCategoryTabs(categoryName).then((tabSet) => {
            this.nav.setRoot(CategoryPage, { 'tabNames': tabSet, 'categoryName': categoryName });
        });
    }

    private openProgram() {
        this.dbService.getProgrammDayCount().then((count) => {
            this.nav.setRoot(HomePage, { 'days': count + 1 });
        });
    }

    private openSettingsModal() {
        this.modalCtrl.create(SettingsModal).present();
    }

    private openAboutModal() {
        this.modalCtrl.create(AboutModal).present();
    }

}

