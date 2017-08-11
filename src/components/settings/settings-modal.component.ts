import { NotificationService } from './../../providers/notification.service';
import { DatabaseService } from './../../providers/database.service';
import { TranslateService } from '@ngx-translate/core';
import { SettingService } from './../../providers/settings.service';
import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';


@Component({
    selector: 'modal-settings',
    templateUrl: 'settings-modal.component.html'
})
export class SettingsModal {

    private vibration: boolean;
    private optimized: boolean;
    private delay: string;
    private notificationTypes: string[];
    private language: string;

    constructor(private viewCtrl: ViewController, private settings: SettingService, public translate: TranslateService,
        private dbService: DatabaseService, private notifcations: NotificationService) {
        this.vibration = settings.hasVibration();
        this.optimized = settings.hasOptimizedNotifications();
        this.delay = settings.getTimeDelay() + "";
        this.notificationTypes = settings.getActiveNotifactionTypes();
        this.language = settings.getCurrLang();
    }

    closeModal(): void {
        this.viewCtrl.dismiss();
    }

    private notify(type: string) {
        switch (type) {
            case "vibration":
                this.settings.setVibration(this.vibration);
                this.dbService.getScheduleEvents().then((data) => this.notifcations.startScheduling(data));
                break;
            case "optimized":
                this.settings.setOptimizedNotifications(this.optimized);
                this.dbService.getScheduleEvents().then((data) => this.notifcations.startScheduling(data));
                break;
            case "delay":
                this.settings.setTimeDelay(parseInt(this.delay));
                this.dbService.getScheduleEvents().then((data) => this.notifcations.startScheduling(data));
                break;
            case "notificationTypes":
                this.settings.setActiveNotifactionTypes(this.notificationTypes);
                this.dbService.getScheduleEvents().then((data) => this.notifcations.startScheduling(data));
                break;
            case "language":
                this.translate.use(this.language);
                // TODO: Dynamic Save
                if (this.language == "en") {
                    this.settings.setNewVeranstaltung(3, 1, "en", "2017/08/14");
                } else {
                    this.settings.setNewVeranstaltung(4, 1, "de", "2017/08/14");
                }
                console.log("Setting language: " + this.language);
                this.settings.setCurrLang(this.language);
                this.dbService.refreshData();
                break;
        }
    }

}
