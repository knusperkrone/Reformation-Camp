import { NotificationService } from './notification.service';
import { Injectable } from '@angular/core';
import { Platform, ToastController } from "ionic-angular";

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { Storage } from '@ionic/storage';
import { File } from '@ionic-native/file';
import { Http } from '@angular/http';

import { BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';

import { APIContract } from "../model/APIContract";
import { SQL_Beschreibung, JOINED_Beschreibung, JOINED_TabContent, JOINED_Termin, ScheduleObject } from "../model/SQLContract";
import { SettingService } from './settings.service';

@Injectable()
export class DatabaseService {
    database: SQLiteObject;
    private readonly databaseChanged: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private readonly databaseReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

    private cached_programm: JOINED_Termin[][] = [];

    constructor(private storage: Storage, private sqlite: SQLite, private http: Http, private file: File, private toastCtrl: ToastController,
        private settingService: SettingService, private notifications: NotificationService, platform: Platform) {        // Wait until device is ready
        platform.ready().then(() => { // Open a database
            this.sqlite.create({
                name: 'backend.db',
                location: 'default'
            }).then((db: SQLiteObject) => {
                this.database = db;
                this.databaseReady.next(true);
            });
        });
    }

    public init(): void {
        this.getScheduleEvents().then((toNotify) => this.notifications.startScheduling(toNotify))
        this.cacheProgram();
    }

    public getDatabaseReady() {
        return this.databaseReady.asObservable();
    }

    public getDatabaseChanged() {
        return this.databaseChanged.asObservable();
    }

    public refreshData(): void {
        this.init();
    }

    private cacheProgram(): void {
        let id_event = this.settingService.getCurrEventID();
        let id_instanz = this.settingService.getCurrInstanzID();
        let year = this.settingService.getCurrYear();
        let ma = this.settingService.isMA();

        this.database.executeSql(JOINED_Termin.query, [id_event, id_event, id_instanz, year]).then((data) => {
            console.log("Caching data");
            // Parse Query
            let tabList: JOINED_Termin[][] = []; // Holds all days
            let dayList: JOINED_Termin[] = []; // Holds a day
            let currDay = 0;

            for (let i = 0; i < data.rows.length; i++) {
                // Get current item and make new termin object
                let cursor = data.rows.item(i);
                let currTermin: JOINED_Termin = new JOINED_Termin(cursor.Uhrzeit, cursor.Titel, cursor.TerminTyp);

                // Check if there are mapped Descriptions for this termin
                if (cursor.BeschreibungTyp != null) {
                    do { // Go trough extra data and add it to currTermin
                        if (ma || cursor.BeschreibungTyp == APIContract.DESRC_TYPE_ACCESS.ALL
                            || cursor.BeschreibungTyp == APIContract.DESRC_TYPE_ACCESS.NOTE) {
                            // Only add permitted data
                            currTermin.details.push(new JOINED_Beschreibung(cursor.Beschreibung, cursor.BeschreibungTyp));
                        }
                        cursor = data.rows.item(++i); // next item

                    } while (i < data.rows.length && cursor.Uhrzeit == currTermin.Uhrzeit); // is cursor still in right dataSet
                    cursor = data.rows.item(--i); // go back to a fresh termin
                }

                // Check if the termin is on a new day
                if (cursor.Tag != currDay) {
                    currDay = cursor.Tag;
                    tabList.push(dayList)
                    dayList = [];
                }
                // Check if user has permissions for this termin
                if (ma || currTermin.TerminTyp != APIContract.TERMIN_TYPE.AUFBAU
                    && currTermin.TerminTyp != APIContract.TERMIN_TYPE.MA) {
                    dayList.push(currTermin);
                }
            }

            // Push the latest day
            if (dayList != null)
                tabList.push(dayList);

            // Save parsed data
            this.cached_programm = tabList;

            // Reschedule notifications
            this.getScheduleEvents().then((toNotify) => this.notifications.startScheduling(toNotify))
            this.databaseChanged.next(true); // Set database ready
        }, (err) => { // Error handling
            console.log('[cacheProgram] Error while getting Data: ' + JSON.stringify(err));
        });
    }

    public getProgrammDayCount(): Promise<number> {
        let id_event = 3;
        return this.database.executeSql("SELECT Termin_Tag FROM Beschreibung WHERE Id_Veranstaltung == ? ORDER BY Termin_Tag DESC", [id_event]).then((data) => {
            return data.rows.item(0).Termin_Tag;
        }, (error) => {
            return 0;
        });
    }

    public getScheduleEvents(): Promise<ScheduleObject[]> {
        // Necessary query values
        let id_event = this.settingService.getCurrEventID();
        let ma = this.settingService.isMA();

        return this.database.executeSql(ScheduleObject.QUERY, [id_event]).then((data) => {
            // Parse Query
            let eventList: ScheduleObject[] = [];
            for (let i = 0; i < data.rows.length; i++) {
                let cursor: ScheduleObject = data.rows.item(i);
                if (ma || cursor.Typ != APIContract.TERMIN_TYPE.AUFBAU
                    && cursor.Typ != APIContract.TERMIN_TYPE.MA) { // TODO: Only show permitted termine
                    eventList.push(new ScheduleObject(cursor.Titel, cursor.Tag, cursor.Uhrzeit, cursor.Typ));
                }
            }
            return eventList;
        }, (error) => {
            console.log("[getAllEvents] Couln't get data ", error);
            return [];
        });
    }

    public getVeranstaltungen(day: number): JOINED_Termin[] {
        return this.cached_programm[day];
    }

    public addNote(noteText: string, day: number, time: string): boolean {
        let id_event = this.settingService.getCurrEventID();
        let id_instanz = this.settingService.getCurrInstanzID();

        this.database.executeSql("INSERT INTO Beschreibung VALUES (?, ?, ?, ?, ?, ?)",
            [id_event, id_instanz, day, time, noteText, APIContract.DESRC_TYPE_ACCESS.NOTE])
            .catch((e) => {
                console.log("Error inserting: ", e);
                return false;
            });

        return true;
    }

    public updateNote(origNote: string, newNote: string, parentText: string, day: number, time: string): boolean {
        let id_event = this.settingService.getCurrEventID();
        let id_instanz = this.settingService.getCurrInstanzID();

        try {
            this.database.executeSql(""
                + "UPDATE Beschreibung "
                + "SET text = ?"
                + "WHERE Id_Veranstaltung == ? "
                + "    AND ID_Instanz == ? "
                + "    AND Termin_Tag == ? "
                + "    AND Termin_Uhrzeit == ? "
                + "    AND Text == ? "
                + "    AND Typ == ?",
                [newNote, id_event, id_instanz, day, time, origNote, APIContract.DESRC_TYPE_ACCESS.NOTE]);
        } catch (e) {
            return false;
        }

        return true;
    }

    public deleteNote(noteText: string, parentText: string, day: number, time: string): boolean {
        let id_event = this.settingService.getCurrEventID();
        let id_instanz = this.settingService.getCurrInstanzID();

        this.database.executeSql(""
            + " DELETE FROM Beschreibung WHERE Id_Veranstaltung == ? "
            + "         AND ID_Instanz == ? "
            + "         AND Termin_Tag == ? "
            + "         AND Termin_Uhrzeit == ? "
            + "         AND Text == ? "
            + "         AND Typ == ?",
            [id_event, id_instanz, day, time, noteText, APIContract.DESRC_TYPE_ACCESS.NOTE])
            .catch((e) => {
                console.log("Error deleting: ", e);
                return false;
            });

        return true;
    }

    public getCategoryNames(): Promise<string[]> {
        let id_event = this.settingService.getCurrEventID();

        return this.database.executeSql("SELECT Titel FROM Kategorie WHERE Id_Veranstaltung == ?", [id_event]).then((data) => {
            // Parse Query
            let names: string[] = [];
            for (let i = 0; i < data.rows.length; i++) {
                names.push(data.rows.item(i).Titel)
            }
            return names;
        }, (err) => { // Error handling
            console.log('[getCategoryNames] Error while getting Data: ' + JSON.stringify(err));
            return [];
        });
    }

    public getCategoryTabs(kategorieName: string): Promise<string[]> {
        let id_event = this.settingService.getCurrEventID();

        return this.database.executeSql("SELECT TabName FROM Kategorie_Tab WHERE Id_Veranstaltung == ? AND Name_Kategorie == ? ORDER BY rang", [id_event, kategorieName]).then((data) => {
            // Parse Query
            let names: string[] = [];
            for (let i = 0; i < data.rows.length; i++) {
                names.push(data.rows.item(i).TabName);
            }
            return names;
        }, (err) => { // Error handling
            console.log('[getCategoryTabs] Error while getting Data: ' + JSON.stringify(err));
            return [];
        });
    }

    public getTabContent(categoryName: string, tabName: string): Promise<JOINED_TabContent[]> {
        let id_event = this.settingService.getCurrEventID(); //TODO: Service

        return this.database.executeSql(JOINED_TabContent.query, [id_event, id_event, id_event, id_event, tabName, categoryName]).then((data) => {
            // Parse query
            let contentList: JOINED_TabContent[] = [];
            for (let i = 0; i < data.rows.length; i++) {
                let cursor = data.rows.item(i);
                let currTitel = new JOINED_TabContent(cursor.Titel, cursor.TitelTyp);

                // Get child titles
                if (cursor.Text != null) {
                    let currRang = cursor.TitelRang;
                    do {
                        currTitel.texts.push(new JOINED_TabContent(cursor.Text, cursor.TextTyp));
                        cursor = data.rows.item(++i); // Next item
                    } while (i < data.rows.length && currRang == cursor.TitelRang);
                    i--; // We went one to far here
                }
                contentList.push(currTitel);
            }
            return contentList;
        }, (err) => {
            console.log('[getTabContent] Error while getting Data: ' + JSON.stringify(err));
            return [];
        });
    }

}
