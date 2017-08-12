import { Injectable } from '@angular/core';
import { Platform } from "ionic-angular";

import { LocalNotifications, ILocalNotification } from '@ionic-native/local-notifications';
import { Vibration } from '@ionic-native/vibration';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import { ScheduleObject } from './../model/SQLContract';
import { SettingService } from './settings.service';


@Injectable()
export class NotificationService {


    constructor(private browser: InAppBrowser, private localNotifications: LocalNotifications,
        private setting: SettingService, private vibration: Vibration) {
        // Register notification callbacks
        this.localNotifications.registerPermission();

        this.localNotifications.on('trigger', (notification: ILocalNotification) => {
            if (this.setting.hasVibration()) {
                this.vibration.vibrate(500);
            }

            let currId = notification.id;
            this.localNotifications.get(currId + 1).then((nextNotification : ILocalNotification) => {
                if (nextNotification.at != notification.at) {

                    this.localNotifications.cancel(nextNotification.id);
                    nextNotification.id = currId;
                    this.localNotifications.schedule(nextNotification);
                }
            });

        });
        this.localNotifications.on('click', (notification) => {
            if (notification.id == 0)
                this.browser.create("www.cvjm-bayern.de").show();
        });
    }

    public startScheduling(toNotifyList: ScheduleObject[]): void {
        // Cancel all other notifications!
        console.log("Start scheduling :" + toNotifyList.length);
        this.localNotifications.cancelAll();

        // Cache recycleable Data
        let delay: number = this.setting.getTimeDelay();
        let optmized: boolean = this.setting.hasOptimizedNotifications();
        let startDate = this.setting.getStartDay();
        let currTime: Date = new Date();

        // Dynamic data-references
        let scheduleDate: Date = null
        let id = 1;

        for (let toSchedule of toNotifyList) {
            // Calc time of the event
            scheduleDate = this.parseScheduleTime(toSchedule, startDate, delay);
            console.log("Scheduling at " + scheduleDate);
            if (scheduleDate < currTime) { // Is event in range?
                continue;
            }


            //Add to schdule list
            this.localNotifications.schedule({
                id: id,
                title: 'Es geht in ' + delay + ' Minuten weiter',
                text: toSchedule.Titel,
                at: scheduleDate,
                led: 'FF0000'
            });

            id++;
        }

        // Guestbook notification
        if (scheduleDate != null && scheduleDate > currTime) // Check for active event
            this.localNotifications.schedule({
                id: 0,
                title: "Schreibe einen Gästebucheintrag",
                at: new Date(scheduleDate.getTime() + 120 * 3600), // 8 Minutes after last event XXX: ???
                led: 'FF0000',
            });
    }

    private parseScheduleTime(toSchedule: ScheduleObject, startDate: Date, delay: number): Date {
        // Parse { hour, minute } offset
        let dayTime: string[] = toSchedule.Uhrzeit.split(":");
        // Hour, minute offset
        let date = new Date(startDate);
        date.setHours(parseInt(dayTime[0]), parseInt(dayTime[1]), 0, 0);
        date.setDate(date.getDate() + toSchedule.Tag); // Set day offset
        return new Date(date.getTime() - delay * 60000);  // Set minute offset
    }

}
