import { UpdaterService } from './../providers/updater.service';
import { SettingService } from './../providers/settings.service';
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

    constructor(platform: Platform, statusBar: StatusBar, private splashScreen: SplashScreen, private dbService: DatabaseService,
        private modalCtrl: ModalController, private updater: UpdaterService, private translate: TranslateService, private setting: SettingService) {

        // Register callbacks for side menu
        this.dbService.getDatabaseChanged().subscribe((changed) => {
            if (changed) {
                this.dbService.getCategoryNames().then((names) => {
                    this.categorys = names
                });
            }
        });

        platform.ready().then(() => {
            console.log("Platform ready");
            statusBar.styleDefault();

            this.initServices();

        });
    }

    private initServices(): void {
        let updateSub = this.updater.isFinished().subscribe((updateFin) => {
            if (updateFin) {
                console.log("Update finished");
                // Check if database is ready
                let settingSub = this.setting.getSettingState().subscribe((settingRdy) => {
                    if (settingRdy) {
                        // Check if settings are loaded
                        this.translate.setDefaultLang(this.setting.getCurrLang());
                        console.log("Settings ready");
                        let dbSub = this.dbService.getDatabaseReady().subscribe((dbRdy) => {
                            if (dbRdy) {
                                console.log("Databse ready");
                                // Init database
                                //this.dbService.getCategoryNames().then((names) => this.categorys = names);
                                this.dbService.init();
                                // Init UI
                                if (this.rootPage == null) {
                                    this.openProgram();
                                    this.splashScreen.hide();
                                }
                                dbSub.unsubscribe();
                            }
                        });
                        settingSub.unsubscribe();
                    }
                    updateSub.unsubscribe();
                });
            }
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

