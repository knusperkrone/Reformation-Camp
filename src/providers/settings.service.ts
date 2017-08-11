import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';

import { APIContract } from '../model/APIContract'

@Injectable()
export class SettingService {

    private readonly settingsReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

    private readonly currEventInfo = {
        curr_id_veranstaltung: 3,
        curr_id_instanz: 1,
        curr_lang: "en",
        startDay: new Date(2017, 7, 14, 0, 0, 0, 0),
        ma: false,
        // notifaction values
        vibration: true,
        optimized_notification: true,
        time_delay: 5,
        // notification types
        "building": true,
        "eating": true,
        "normal": true,
        "optional": true,
        "leader": true,
    };

    private counter: number = 0;

    constructor(private storage: Storage) {
        this.initEventValues();
    }

    public getSettingState() {
        return this.settingsReady.asObservable();
    }

    public getCurrEventID(): number {
        return this.currEventInfo.curr_id_veranstaltung;
    }

    public getCurrInstanzID(): number {
        return this.currEventInfo.curr_id_instanz;
    }

    public setNewVeranstaltung(id_veranstaltung: number, id_instanz: number, language: string, startDay: string): void {
        this.currEventInfo.curr_id_veranstaltung = id_veranstaltung;
        this.currEventInfo.curr_id_instanz = id_instanz;
        this.currEventInfo.curr_lang = language;
        let dates: string[] = startDay.split("/");
        this.currEventInfo.startDay = new Date(parseInt(dates[0]), parseInt(dates[1]), parseInt(dates[2]), 0, 0, 0, 0);
        // Save values
        this.storage.set('curr_id_veranstaltung', id_veranstaltung);
        this.storage.set('curr_id_instanz', id_instanz);
        this.storage.set('curr_lang', language);
        this.storage.set('startDay', startDay);
        this.settingsReady.next(true);
    }

    public getCurrLang(): string {
        return this.currEventInfo.curr_lang;
    }

    public setCurrLang(value: string) {
        this.currEventInfo.curr_lang = value;
        this.storage.set("curr_lang", value);
    }

    public getCurrYear(): number {
        return 2017; // TODO: Some logic
    }

    public getStartDay(): Date {
        return new Date(2017, 7, 14, 0, 0, 0, 0);
    }

    public getActiveNotifactionTypes(): string[] {
        let active: string[] = [];
        for (let key of ["building", "eating", "normal", "optional", "leader"]) {
            if (this.currEventInfo[key])
                active.push(key)
        }
        return active;
    }

    public setActiveNotifactionTypes(activeNotifactions: string[]): void {
        for (let key of ["building", "eating", "normal", "optional", "leader"]) {
            // Check if active contains the key
            let contains: boolean = activeNotifactions.some(x => x === key);
            this.currEventInfo[key] = contains;
            this.storage.set(key, contains);
        }
    }

    public isMA(): boolean {
        return this.currEventInfo.ma;
    }

    public setMA(val: boolean): void {
        this.currEventInfo.ma = val;
        // Set value
        this.storage.set('ma', val);
        this.settingsReady.next(true);
    }

    public hasVibration(): boolean {
        return this.currEventInfo.vibration;
    }

    public setVibration(value: boolean): void {
        this.currEventInfo.vibration = value;
        this.storage.set('vibration', value)
    }

    public hasOptimizedNotifications(): boolean {
        return this.currEventInfo.optimized_notification;
    }

    public setOptimizedNotifications(value: boolean): void {
        this.currEventInfo.optimized_notification = value;
        this.storage.set('optimized_notification', value)
    }

    public getTimeDelay(): number {
        return this.currEventInfo.time_delay;
    }

    public setTimeDelay(value: number) {
        this.currEventInfo.time_delay = value;
        this.storage.set('time_delay', value);
    }

    public showEventNotification(terminTyp: number): boolean {
        switch (terminTyp) {
            case APIContract.TERMIN_TYPE.AUFBAU:
                return this.currEventInfo.building;
            case APIContract.TERMIN_TYPE.ESSEN:
                return this.currEventInfo.eating;
            case APIContract.TERMIN_TYPE.FREIWILLIG:
                return this.currEventInfo.optional;
            case APIContract.TERMIN_TYPE.MA:
                return this.currEventInfo.leader;
            case APIContract.TERMIN_TYPE.PROGRAMM:
                return this.currEventInfo.normal;
        }
        throw new TypeError("Unknown TERMIN_TYPE: " + terminTyp);
    }

    private initEventValues(): void {
        // Event setting
        for (let key of Object.keys(this.currEventInfo))
            if (key != 'startDay')
                this.getKeyValue(key, this.currEventInfo);
        this.getEventKeyDate();
        // Notifaction setting
    }

    private getKeyValue(key: string, object: object): void {
        this.storage.get(key).then((val) => {
            if (val)
                object[key] = val
            this.counter++;
            if (this.counter >= Object.keys(this.currEventInfo).length - 1)
                this.settingsReady.next(true);
        });
    }

    private getEventKeyDate(): void {
        this.storage.get("startDay").then((val) => {
            if (val) {
                let dates: string[] = val.split("/"); // Split date in parts (YYYY|MM|DD)
                this.currEventInfo.startDay = new Date(parseInt(dates[0]), parseInt(dates[1]), parseInt(dates[2]), 0, 0, 0, 0);
            }
        });
    }

}
