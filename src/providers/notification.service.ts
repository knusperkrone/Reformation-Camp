import { Injectable } from '@angular/core';
import { Platform } from "ionic-angular";

import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications';
import { Vibration } from '@ionic-native/vibration';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import { ScheduleObject } from './../model/SQLContract';
import { SettingService } from './settings.service';


@Injectable()
export class NotificationService {


    constructor(platform: Platform, private browser: InAppBrowser, private localNotifications: LocalNotifications,
        private setting: SettingService, private vibration: Vibration) {
        // Register notification callbacks
        platform.ready().then(() => {
            this.localNotifications.registerPermission();

            this.localNotifications.on('trigger', () => {
                if (this.setting.hasVibration())
                    this.vibration.vibrate(500);
            });
            this.localNotifications.on('click', (notification) => {
                if (notification.id == 0)
                    this.browser.create("www.cvjm-bayern.de").show();
            });
        });
    }

    public startScheduling(toNotifyList: ScheduleObject[]): void {
        // Cancel all other notifications!
        this.localNotifications.cancelAll();

        // Cache recycleable Data
        let delay: number = this.setting.getTimeDelay();
        let optmized: boolean = this.setting.hasOptimizedNotifications();
        let startDate = this.setting.getStartDay();
        let currTime: Date = new Date();

        // Dynamic data-references
        let toScheduleList: ILocalNotification[] = []
        let scheduleDate: Date = null
        let id = 1;

        for (let toSchedule of toNotifyList) {
            // Calc time of the event
            scheduleDate = this.parseScheduleTime(toSchedule, startDate);

            if (scheduleDate < currTime) { // Is event in range?
                continue;
            }
            //Add to schdule list
            toScheduleList.push({
                id: id,
                title: 'Es geht in ' + delay + ' Minuten weiter',
                text: toSchedule.Titel,
                at: scheduleDate,
                led: 'FF0000'
            });

            if (!optmized) // Individual notifivation for every event?
                id++;
        }
        // Make notifcations
        this.localNotifications.schedule(toScheduleList);

        // Guestbook notification
        if (scheduleDate != null && scheduleDate > currTime) // Check for active event
            this.localNotifications.schedule({
                id: id,
                title: "Schreibe einen Gästebucheintrag",
                at: new Date(scheduleDate.getTime() + 8 * 3600), // 8 Minutes after last event XXX: ???
                led: 'FF0000',
            });
    }

    private parseScheduleTime(toSchedule: ScheduleObject, startDate: Date): Date {
        // Parse { hour, minute } offset
        let dayTime: string[] = toSchedule.Uhrzeit.split(":");
        // Hour, minute offset
        let date = new Date(startDate);
        date.setHours(parseInt(dayTime[0]), parseInt(dayTime[1]), 0, 0);
        // Set day offset
        date.setDate(date.getDate() + toSchedule.Tag);
        return date;
    }

}
